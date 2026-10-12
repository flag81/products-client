#!/usr/bin/env node
/**
 * Mobile-first guardrail audit (Stage 0).
 *
 * Drives the app at phone / tablet / desktop widths with real touch emulation
 * (hasTouch + isMobile + DPR 3) and reports the invariants a mobile-first
 * stylesheet is supposed to guarantee:
 *
 *   - no horizontal overflow
 *   - tap targets: WCAG 2.5.8 AA floor 24x24, mobile-first target 44x44
 *   - touch hygiene: touch-action: manipulation, controlled tap highlight
 *   - viewport safety: the --vh-full token (dvh) and safe-area aware bars
 *   - no blocking third-party SDK (Apple) requested on page load
 *   - the click-flash pilot still fires on a real tap (regression gate)
 *
 * Usage (start a server first, e.g. `npm run dev` on :5173 or `npm run preview`):
 *   node scripts/mobile-audit.mjs --url http://localhost:5173
 *   node scripts/mobile-audit.mjs --url http://localhost:5173 --json out.json
 *   node scripts/mobile-audit.mjs --url http://localhost:5173 --fingerprint
 *
 * Target selection: --url, else $AUDIT_URL, else the first live server out of
 * :5173 (dev) and :4173 (preview); if none answers it exits 2 with instructions
 * instead of guessing. On Windows/PowerShell call node directly or set AUDIT_URL:
 * `npm run mobile:audit -- --url ...` does not forward the flag there, which used
 * to leave the audit measuring whichever server happened to be the default.
 *
 * Audit against the dev server whenever the production API is unreachable: the
 * built bundle calls that API directly, and an unreachable API shows up as
 * "Failed to fetch" pageerrors, which are gate failures and not layout results.
 *
 * Playwright lookup order: $PW_MODULE, then "playwright", then the sibling
 * server checkout (../zbritje-server/node_modules/playwright) so this runs
 * without adding a dependency here yet (see MOBILE.md).
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));

function loadPlaywright() {
  const candidates = [
    process.env.PW_MODULE,
    "playwright",
    join(HERE, "..", "..", "zbritje-server", "node_modules", "playwright"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      /* try the next one */
    }
  }
  console.error(
    [
      "playwright not found. Tried:",
      ...candidates.map((c) => `  - ${c}`),
      "",
      "Fix: `yarn add -D playwright` (touches yarn.lock) or point PW_MODULE at an existing install.",
    ].join("\n"),
  );
  process.exit(2);
}

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

/**
 * Not gate failures:
 *  - environment noise: the preview origin is not in the API CORS list;
 *  - pre-existing app warnings that Stage 0 did not introduce (listed so they
 *    cannot hide a *new* console error).
 */
const KNOWN_ISSUES = [
  /CORS|Access-Control-Allow-Origin|Failed to load resource|net::ERR|ERR_/i,
  /Invalid prop `isFavorite` of type `number`/, // FavoriteToggle: API returns 0/1 (pre-existing)
];
const isKnownIssue = (text) => KNOWN_ISSUES.some((pattern) => pattern.test(text));

const VIEWPORTS = [
  { name: "320 small phone", width: 320, height: 568, touch: true },
  { name: "360 android", width: 360, height: 740, touch: true },
  { name: "375 iPhone SE", width: 375, height: 667, touch: true },
  { name: "390 iPhone 14", width: 390, height: 844, touch: true },
  { name: "430 iPhone Pro Max", width: 430, height: 932, touch: true },
  { name: "768 md boundary", width: 768, height: 1024, touch: true },
  { name: "1024 tablet landscape", width: 1024, height: 768, touch: false },
  { name: "1440 desktop", width: 1440, height: 900, touch: false },
];

function parseArgs(argv) {
  // AUDIT_URL is the escape hatch for shells/scripts that cannot pass flags
  // through npm ("npm run mobile:audit -- --url ..." drops them on PowerShell).
  const args = { url: process.env.AUDIT_URL || null, json: null, fingerprint: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--url") args.url = argv[++i];
    else if (argv[i] === "--json") args.json = argv[++i];
    else if (argv[i] === "--fingerprint") args.fingerprint = true;
  }
  return args;
}

/** Dev first: it proxies the local API, so it audits without internet access. */
const TARGET_CANDIDATES = ["http://localhost:5173", "http://localhost:4173"];

/**
 * Resolves the server to audit: --url, then $AUDIT_URL, then the first live
 * candidate. Refusing to guess when nothing answers is deliberate - an audit
 * that silently measures the wrong server is worse than no audit at all.
 */
async function pickTarget(explicit) {
  if (explicit) return { url: explicit, source: "--url/AUDIT_URL" };
  for (const candidate of TARGET_CANDIDATES) {
    try {
      const res = await fetch(candidate, { method: "HEAD" });
      if (res.status < 500) return { url: candidate, source: "auto-detected" };
    } catch {
      /* nothing listening on that port */
    }
  }
  console.error(
    [
      "no server to audit. Start one first:",
      "  npm run dev       # http://localhost:5173 (preferred: proxies the local API)",
      "  npm run preview   # http://localhost:4173 (needs the production API to answer)",
      "",
      "then point the audit at it:",
      "  node scripts/mobile-audit.mjs --url http://localhost:5173",
      "  $env:AUDIT_URL='http://localhost:5173'; npm run mobile:audit",
    ].join("\n"),
  );
  process.exit(2);
}

/** Runs inside the page: collects everything that can be measured from the DOM. */
function probe() {
  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  };
  const describe = (el) => {
    const rect = el.getBoundingClientRect();
    const cls =
      typeof el.className === "string" && el.className
        ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
        : "";
    const label = (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "")
      .trim()
      .slice(0, 30);
    return {
      sel: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls}`,
      label,
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      flash: el.hasAttribute("data-flash"),
    };
  };

  const interactive = Array.from(
    document.querySelectorAll(
      'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, [data-flash]',
    ),
  )
    .filter(visible)
    .map(describe);

  const flashEls = Array.from(document.querySelectorAll("[data-flash]")).filter(visible);
  const sample = flashEls[0] || null;
  const promoBar = document.querySelector(".promo-bar, .promo-bar-show");
  const backToTop = document.querySelector('button[aria-label="Kthehu lart"]');
  const rootStyle = getComputedStyle(document.documentElement);

  return {
    innerWidth: window.innerWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    docScrollHeight: document.documentElement.scrollHeight,
    interactiveCount: interactive.length,
    below44: interactive.filter((r) => r.w < 44 || r.h < 44),
    below24: interactive.filter((r) => r.w < 24 || r.h < 24),
    flashCount: flashEls.length,
    flashSample: sample
      ? {
          ...describe(sample),
          touchAction: getComputedStyle(sample).getPropertyValue("touch-action").trim(),
          tapHighlight: getComputedStyle(sample).getPropertyValue("-webkit-tap-highlight-color").trim(),
          userSelect: getComputedStyle(sample).getPropertyValue("user-select").trim(),
        }
      : null,
    tokens: {
      vhFull: rootStyle.getPropertyValue("--vh-full").trim(),
      safeBottom: rootStyle.getPropertyValue("--safe-bottom").trim(),
      safeLeft: rootStyle.getPropertyValue("--safe-left").trim(),
      tapMin: rootStyle.getPropertyValue("--tap-min").trim(),
    },
    safeArea: {
      promoBar: promoBar ? { bottom: getComputedStyle(promoBar).bottom, left: getComputedStyle(promoBar).left } : null,
      backToTop: backToTop
        ? { bottom: getComputedStyle(backToTop).bottom, right: getComputedStyle(backToTop).right }
        : null,
    },
    overflowers: Array.from(document.querySelectorAll("body *"))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0) return false;
        if (rect.right <= window.innerWidth + 1 && rect.left >= -1) return false;
        // Children of a horizontal scroller are meant to sit outside the
        // viewport, so only report elements that nothing scrolls for.
        for (let parent = el.parentElement; parent; parent = parent.parentElement) {
          const overflowX = getComputedStyle(parent).overflowX;
          if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden") return false;
        }
        return true;
      })
      .slice(0, 6)
      .map(describe),
  };
}

async function run() {
  const args = parseArgs(process.argv);
  const { chromium } = loadPlaywright();
  const target = await pickTarget(args.url);
  const base = target.url.replace(/\/$/, "");

  const browser = await chromium.launch();
  const results = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.touch ? 3 : 1,
      hasTouch: viewport.touch,
      isMobile: viewport.touch,
      userAgent: viewport.touch ? IPHONE_UA : undefined,
    });
    const page = await context.newPage();

    const errors = [];
    const knownIssues = [];
    const thirdParty = [];
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text().slice(0, 160);
      if (isKnownIssue(text)) knownIssues.push(text);
      else errors.push(text);
    });
    page.on("pageerror", (error) => {
      const text = `pageerror: ${String(error).slice(0, 160)}`;
      if (isKnownIssue(text)) knownIssues.push(text);
      else errors.push(text);
    });
    page.on("request", (request) => {
      if (/appleid\.cdn-apple\.com|apple\.com\/appleauth/.test(request.url())) thirdParty.push(request.url());
    });

    // ?promo=2 also renders the capture bar, so the fixed-bar safe-area maths can
    // be checked in the same pass.
    await page.goto(`${base}/?promo=2`, { waitUntil: "load", timeout: 45000 }).catch((error) => {
      errors.push(`navigation: ${error.message.slice(0, 160)}`);
    });
    await page.waitForSelector("[data-flash]", { timeout: 12000 }).catch(() => {});
    // Product cards arrive from the API after mount; without this settle the
    // element/target counts drift by a card between runs depending on load
    // timing, which would make before/after comparisons look like regressions.
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(400);
    await page.waitForTimeout(700);

    const data = await page.evaluate(probe);

    // The floating back-to-top button only mounts past a scroll threshold, so
    // scroll the product scroller and re-read its fixed offsets.
    await page.evaluate(() => {
      const scroller = document.querySelector(".hide-scrollbar") || document.scrollingElement;
      if (scroller) scroller.scrollTop = 900;
      window.scrollTo(0, 900);
    });
    await page.waitForTimeout(250);
    const scrolledBackToTop = await page.evaluate(() => {
      const el = document.querySelector('button[aria-label="Kthehu lart"]');
      return el ? { bottom: getComputedStyle(el).bottom, right: getComputedStyle(el).right } : null;
    });

    // Regression gate: a real tap must still flash a [data-flash] icon. A
    // coordinate tap is used instead of locator.tap() because the flashing
    // element is often an <svg> whose centre is covered by a sibling overlay;
    // the delegated listener only needs a genuine pointerdown at that point.
    let flash = { tested: false };
    const flashPoint = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("[data-flash]")).find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (!el) return null;
      el.setAttribute("data-flash-probe", "1");
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    if (flashPoint) {
      try {
        if (viewport.touch) await page.touchscreen.tap(flashPoint.x, flashPoint.y);
        else await page.mouse.click(flashPoint.x, flashPoint.y);
        flash = await page.evaluate(() => {
          const el = document.querySelector("[data-flash-probe]");
          const style = el ? getComputedStyle(el) : null;
          return {
            tested: true,
            hasClass: !!el && el.classList.contains("click-flash"),
            animationName: style ? style.animationName : null,
            animationDuration: style ? style.animationDuration : null,
          };
        });
        await page.waitForTimeout(900); // let the flash finish before the next viewport
      } catch (error) {
        flash = { tested: true, error: error.message.slice(0, 120) };
      }
    }

    results.push({
      viewport: viewport.name,
      width: viewport.width,
      overflowPx: Math.max(0, data.docScrollWidth - data.innerWidth),
      docScrollHeight: data.docScrollHeight,
      interactiveCount: data.interactiveCount,
      below44: data.below44.length,
      below24: data.below24.length,
      worstTargets: data.below24
        .slice()
        .sort((a, b) => a.w * a.h - b.w * b.h)
        .slice(0, 6),
      flashCount: data.flashCount,
      flash,
      tokens: data.tokens,
      safeArea: { ...data.safeArea, backToTop: data.safeArea.backToTop || scrolledBackToTop },
      flashSample: data.flashSample,
      overflowers: data.overflowers,
      thirdParty,
      errors,
      knownIssues,
    });

    await context.close();
  }

  await browser.close();

  if (args.json) writeFileSync(args.json, JSON.stringify(results, null, 2));

  if (args.fingerprint) {
    for (const row of results) {
      console.log(
        `${String(row.width).padStart(4)}  overflow=${String(row.overflowPx).padStart(3)}px  scrollH=${String(row.docScrollHeight).padStart(5)}  interactive=${String(row.interactiveCount).padStart(3)}  <44=${String(row.below44).padStart(3)}  <24=${String(row.below24).padStart(3)}  flash=${String(row.flashCount).padStart(3)}`,
      );
    }
    const bad = results.filter((row) => row.overflowPx > 1 || row.errors.length);
    process.exit(bad.length ? 1 : 0);
  }

  console.log(`mobile audit - ${base}  [${target.source}]\n`);
  const header = ["viewport", "overflow", "interactive", "<44px", "<24px", "flash", "3rd-party", "errors", "known"];
  console.log("  " + header.map((cell, index) => (index === 0 ? cell.padEnd(26) : cell.padStart(11))).join(""));
  for (const row of results) {
    console.log(
      "  " +
        [
          row.viewport.padEnd(26),
          `${row.overflowPx}px`.padStart(11),
          String(row.interactiveCount).padStart(11),
          String(row.below44).padStart(11),
          String(row.below24).padStart(11),
          String(row.flashCount).padStart(11),
          String(row.thirdParty.length).padStart(11),
          String(row.errors.length).padStart(11),
          String(row.knownIssues.length).padStart(11),
        ].join(""),
    );
  }

  const phone = results.find((row) => row.width === 390) || results[0];
  console.log(`\n  ${phone.width}px detail`);
  console.log(`    tokens      : ${JSON.stringify(phone.tokens)}`);
  console.log(`    capture bar : ${JSON.stringify(phone.safeArea.promoBar)}`);
  console.log(`    back-to-top : ${JSON.stringify(phone.safeArea.backToTop)}`);
  console.log(`    flash sample: ${JSON.stringify(phone.flashSample)}`);
  console.log(`    flash tap   : ${JSON.stringify(phone.flash)}`);
  if (phone.worstTargets.length) {
    console.log("    smallest targets:");
    for (const target of phone.worstTargets) {
      console.log(
        `      ${String(target.w).padStart(4)}x${String(target.h).padEnd(4)} ${target.sel}${target.label ? ` "${target.label}"` : ""}${target.flash ? " [flash]" : ""}`,
      );
    }
  }
  if (phone.overflowers.length) {
    console.log("    overflowing elements:");
    for (const el of phone.overflowers) console.log(`      ${el.sel} x=${el.x} w=${el.w}`);
  }

  const problems = [];
  for (const row of results) {
    if (row.overflowPx > 1) problems.push(`${row.viewport}: horizontal overflow ${row.overflowPx}px`);
    if (row.errors.length) problems.push(`${row.viewport}: ${row.errors.length} console error(s): ${row.errors[0]}`);
    if (row.flash.tested && (!row.flash.hasClass || row.flash.animationName !== "click-flash-glow")) {
      problems.push(`${row.viewport}: click-flash regression ${JSON.stringify(row.flash)}`);
    }
  }
  const thirdParty = results.flatMap((row) => row.thirdParty);
  if (thirdParty.length) problems.push(`third-party SDK requested on load: ${thirdParty[0]}`);

  console.log("");
  if (problems.length) {
    console.log(`  PROBLEMS (${problems.length}):`);
    for (const problem of problems) console.log(`    x ${problem}`);
  } else {
    console.log("  PROBLEMS: none");
  }
  const knownTotal = results.reduce((total, row) => total + row.knownIssues.length, 0);
  if (knownTotal) {
    const example = results.find((row) => row.knownIssues.length)?.knownIssues[0] || "";
    console.log(`  known/pre-existing, not gated: ${knownTotal}  (${example.slice(0, 90)})`);
  }
  console.log(`  tap targets below 44px at ${phone.width}px: ${phone.below44} (Stage 1 drives this to 0)`);
  console.log("");

  process.exit(problems.length ? 1 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(2);
});
