#!/usr/bin/env node
/**
 * Mobile-first weight budget (Stage 0 guardrail).
 *
 * A phone pays for everything the initial route pulls in, so this script turns
 * the mobile-first targets into something that fails loudly:
 *
 *   FAIL   - a regression that must be fixed before shipping (today's numbers
 *            sit just under these, so they act as a regression lock).
 *   TARGET - the mobile-first goal that the plan drives towards (route
 *            splitting, Bootstrap subset, lazy third-party SDK).
 *
 * Usage:
 *   node scripts/mobile-budget.mjs            # needs a prior `npm run build`
 *   node scripts/mobile-budget.mjs --json     # machine readable
 *
 * As with mobile-audit.mjs, call node directly (or set MOBILE_BUDGET_JSON=1):
 * `npm run mobile:budget -- --json` does not forward the flag on
 * Windows/PowerShell.
 *
 * No dependencies: reads dist/ and gzips in memory.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, "..", "dist");
const AS_JSON = process.argv.includes("--json") || process.env.MOBILE_BUDGET_JSON === "1";

const KB = 1024;
/** Hard fails: a change that makes the mobile payload worse than today. */
const FAIL = {
  jsGzip: 215 * KB,
  cssGzip: 40 * KB,
  singleChunkGzip: 215 * KB,
  // Biggest code asset on disk today is the app chunk (~654 kB raw), so this
  // locks the *current* size in place: any chunk that grows past it fails.
  singleChunkRaw: 680 * KB,
};
/**
 * Static assets (images/fonts in public/) only reach a phone when the page
 * actually references them, so they are reported as advisories instead of
 * failing the build. Today mainlogo.png (937 kB) and mainlogo2.png (884 kB) are
 * dead weight - referenced nowhere in src/ - and are Stage 1 cleanup.
 */
const ADVISORY_RAW = 300 * KB;
/** Mobile-first goals from the plan. */
const TARGET = {
  jsGzip: 150 * KB,
  cssGzip: 15 * KB,
};

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function gzipSize(file) {
  return gzipSync(readFileSync(file), { level: 9 }).length;
}

function fmt(bytes) {
  return `${(bytes / KB).toFixed(2)} kB`;
}

function main() {
  let files;
  try {
    files = walk(DIST);
  } catch {
    console.error("dist/ not found - run `npm run build` first.");
    process.exit(2);
  }

  const rows = files
    .map((file) => {
      const name = relative(DIST, file).split("\\").join("/");
      const raw = statSync(file).size;
      const gz = /\.(js|mjs|css|html|svg)$/.test(file) ? gzipSize(file) : null;
      return { name, raw, gz, ext: extname(file).toLowerCase() };
    })
    .sort((a, b) => b.raw - a.raw);

  const js = rows.filter((r) => r.ext === ".js");
  const css = rows.filter((r) => r.ext === ".css");
  const sum = (list, key) => list.reduce((total, r) => total + (r[key] || 0), 0);

  const jsGzip = sum(js, "gz");
  const cssGzip = sum(css, "gz");
  const biggestJs = js.slice().sort((a, b) => (b.gz || 0) - (a.gz || 0))[0];
  const singleChunkGzip = biggestJs?.gz || 0;

  const fails = [];
  const targets = [];

  if (jsGzip > FAIL.jsGzip) fails.push(`initial JS ${fmt(jsGzip)} > budget ${fmt(FAIL.jsGzip)}`);
  if (cssGzip > FAIL.cssGzip) fails.push(`initial CSS ${fmt(cssGzip)} > budget ${fmt(FAIL.cssGzip)}`);
  if (singleChunkGzip > FAIL.singleChunkGzip) {
    fails.push(`single JS chunk ${fmt(singleChunkGzip)} > budget ${fmt(FAIL.singleChunkGzip)} (${biggestJs?.name})`);
  }
  const advisories = [];
  for (const row of rows) {
    if (row.raw <= ADVISORY_RAW) continue;
    if (/\.(js|mjs|css|html)$/.test(row.name)) {
      if (row.raw > FAIL.singleChunkRaw) {
        fails.push(`code asset ${row.name} is ${fmt(row.raw)} on disk > ${fmt(FAIL.singleChunkRaw)}`);
      }
    } else {
      advisories.push(`${row.name} is ${fmt(row.raw)} on disk (static asset, not in the initial payload)`);
    }
  }

  if (jsGzip > TARGET.jsGzip) targets.push(`initial JS ${fmt(jsGzip)} - mobile-first target ${fmt(TARGET.jsGzip)} (route-split /dashboard + /product/:id)`);
  if (cssGzip > TARGET.cssGzip) targets.push(`initial CSS ${fmt(cssGzip)} - mobile-first target ${fmt(TARGET.cssGzip)} (Bootstrap is ~80% of it)`);
  if (js.length === 1) targets.push("only one JS chunk: no route splitting at all");

  const indexHtml = rows.find((r) => r.name === "index.html");
  if (indexHtml) {
    const html = readFileSync(join(DIST, "index.html"), "utf8");
    if (/appleid\.cdn-apple\.com/.test(html)) {
      fails.push("index.html still loads the Apple SDK as a blocking <script>");
    }
  }

  const result = {
    jsGzip,
    cssGzip,
    jsChunks: js.length,
    biggestJs: biggestJs ? { name: biggestJs.name, gzip: biggestJs.gz, raw: biggestJs.raw } : null,
    files: rows,
    fails,
    targets,
    advisories,
  };

  if (AS_JSON) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(fails.length ? 1 : 0);
  }

  console.log("mobile weight budget - dist/\n");
  console.log("  file                                   raw        gzip");
  for (const row of rows) {
    console.log(`  ${row.name.padEnd(36)} ${fmt(row.raw).padStart(9)}  ${(row.gz ? fmt(row.gz) : "-").padStart(10)}`);
  }
  console.log(`\n  JS  total: ${fmt(sum(js, "raw"))} / ${fmt(jsGzip)} gzip  (${js.length} chunk${js.length === 1 ? "" : "s"})`);
  console.log(`  CSS total: ${fmt(sum(css, "raw"))} / ${fmt(cssGzip)} gzip`);

  console.log("");
  if (fails.length) {
    console.log(`  FAIL (${fails.length}):`);
    for (const line of fails) console.log(`    x ${line}`);
  } else {
    console.log("  FAIL: none - payload is within the regression budget.");
  }
  if (targets.length) {
    console.log(`\n  mobile-first targets not met yet (${targets.length}):`);
    for (const line of targets) console.log(`    - ${line}`);
  }
  if (advisories.length) {
    console.log(`\n  advisory, not gated (${advisories.length}):`);
    for (const line of advisories) console.log(`    - ${line}`);
  }
  console.log("");
  process.exit(fails.length ? 1 : 0);
}

main();
