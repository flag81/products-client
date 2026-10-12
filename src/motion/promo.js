/**
 * Capture ("promo") mode - a URL flag that force-enables and re-plays the Home
 * animations so a take can be screen-recorded for social media.
 *
 *   /?promo=1     force the animations on + show the capture bar
 *   /?promo=0.5   ...at half speed (slow motion, reads better on video)
 *   /?promo=0.25  ...a quarter speed (slowest preset)
 *   /?promo=2     ...twice as fast (snappier, for short clips)
 *   /?promo=0     explicit off (handy for A/B linking)
 *   /?anim=1      alias of /?promo=1
 *
 * The number is a *playback speed*, exactly like a video player: below 1 is slow
 * motion (animations get longer), above 1 is fast. Durations and springs are
 * multiplied by `1 / speed` through `scaled()` / `scaleSpring()` below.
 *
 * What "force" means - all three downgrades are lifted on purpose, because the
 * animations are the thing being recorded:
 *   - OS "reduce motion"        -> MotionConfig gets reducedMotion="never"
 *                                 (see App.jsx) and the reduced-motion CSS block
 *                                 is scoped to `:root:not(.promo-mode)`
 *   - low-end device downgrade  -> isLowEndDevice() reports false (tokens.js)
 *   - (nothing else changes)
 *
 * Without the flag this module costs a few hundred bytes of unused parsing and
 * the app behaves exactly as before.
 */

/** Playback speeds offered by the capture bar's "Speed" button, cycle order. */
export const PROMO_SPEEDS = [1, 0.75, 0.5, 0.25, 2];

const SPEED_MIN = 0.25;
const SPEED_MAX = 4;
/** Values that mean "on, normal speed". `?promo` (empty value) is included. */
const TRUTHY = new Set(["", "1", "true", "on", "yes", "promo", "capture"]);
/** Values that mean "off". */
const FALSY = new Set(["0", "false", "off", "no", "none"]);

const clampSpeed = (value) => Math.min(SPEED_MAX, Math.max(SPEED_MIN, value));

/**
 * Pure parser - kept separate from `window` so it can be unit-tested / reused.
 * @param {string} search a `location.search` string (leading `?` optional)
 * @returns {{enabled: boolean, speed: number, key: "promo"|"anim"}}
 */
export function parsePromo(search) {
  const params = new URLSearchParams(search || "");
  const key = params.has("promo") ? "promo" : params.has("anim") ? "anim" : null;

  if (!key) return { enabled: false, speed: 1, key: "promo" };

  const raw = String(params.get(key) ?? "").trim().toLowerCase();
  if (FALSY.has(raw)) return { enabled: false, speed: 1, key };

  if (TRUTHY.has(raw)) return { enabled: true, speed: 1, key };

  // `0.5` / `0.5x` / `1.5` -> speed multiplier
  const speed = Number(raw.replace(/x$/, ""));
  if (!Number.isFinite(speed) || speed <= 0) return { enabled: true, speed: 1, key };

  return { enabled: true, speed: clampSpeed(speed), key };
}

const parsed = parsePromo(typeof window !== "undefined" ? window.location.search : "");

/** Parsed capture-mode state for this page load. */
export const promo = { enabled: parsed.enabled, speed: parsed.speed };

/** True when this page load was opened with the capture flag. */
export const isPromoMode = parsed.enabled;

/** @type {"promo"|"anim"} which query key was used (kept when rewriting the URL) */
export const PROMO_PARAM_KEY = parsed.key;

// Let plain CSS know as well (the reduced-motion overrides opt out for promo),
// and publish the time scale so pure-CSS animations - e.g. the click flash in
// styles/motion.css - stretch exactly like the Motion-driven ones.
if (isPromoMode && typeof document !== "undefined") {
  const root = document.documentElement;
  root.classList.add("promo-mode");
  root.style.setProperty("--motion-time-scale", String(promoTimeScale()));
}

/**
 * Time scale to apply to every timed animation: `1 / playback speed`.
 * 1 at normal speed, 2 for half speed, 0.5 for double speed.
 */
export function promoTimeScale() {
  return 1 / promo.speed;
}

/**
 * Scales a duration / delay / stagger (seconds) by the playback speed of the
 * capture mode, so `?promo=0.5` really is slow motion. At 1x it is a no-op, so
 * the tokens keep their tuned values.
 */
export function scaled(seconds) {
  return promo.speed === 1 ? seconds : seconds * promoTimeScale();
}

/**
 * Same shape, played slower/faster. Compressing time by `t` means
 * stiffness / t^2 with damping / t, which keeps the overshoot identical: a
 * slow-motion take looks like the real animation, not a different one.
 */
export function scaleSpring(spring) {
  const t = promoTimeScale();
  if (t === 1 || !spring || spring.type !== "spring") return spring;

  return {
    ...spring,
    stiffness: spring.stiffness / (t * t),
    damping: spring.damping / t,
  };
}

/* ---------------------------------------------------------------------------
   Replay store - lets the capture bar (or a test) restart the entrance
   animation for everything currently on screen, without a page reload.
   --------------------------------------------------------------------------- */

let replayToken = 0;
const listeners = new Set();

/** Restart the entrance animations on the next render. */
export function requestReplay() {
  replayToken += 1;
  listeners.forEach((listener) => listener());
}

export function getReplayToken() {
  return replayToken;
}

export function subscribeReplay(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Change the promo speed in the URL and reload. A reload (instead of a live
 * re-render) keeps the recorded take byte-for-byte identical to what the URL
 * describes, and keeps the speed baked into the tokens.
 * @param {number|string} value e.g. 0.5, or 0 to switch capture mode off
 */
export function setPromoParam(value) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.set(PROMO_PARAM_KEY, String(value));
  // drop the alias so the two keys can never disagree
  url.searchParams.delete(PROMO_PARAM_KEY === "promo" ? "anim" : "promo");
  window.location.replace(url.toString());
}
