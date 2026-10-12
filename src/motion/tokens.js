/**
 * Motion tokens for the animated Home pilot (search bar + product cards).
 *
 * Every duration / easing / spring used by the animated components lives here so
 * the whole surface keeps one "feel" and can be retuned in a single place.
 * The values are deliberately short: UI feedback should read as responsiveness,
 * not as decoration.
 *
 * Durations and springs are wrapped in `scaled()` / `scaleSpring()`, which are
 * no-ops at normal speed and multiply by the promo speed when the app is opened
 * with `?promo=<speed>` for screen recording (see ./promo.js).
 */
import { isPromoMode, scaled, scaleSpring } from "./promo";

export const DURATION = {
  /** micro feedback (clear button, small pops) */
  fast: scaled(0.16),
  /** default entrance for surfaces */
  base: scaled(0.24),
  /** roomier entrance (banner) */
  slow: scaled(0.34),
};

/** cubic-bezier aliases (Motion accepts numeric arrays) */
export const EASE = {
  /** quick start, soft landing (iOS-ish ease-out) */
  out: [0.22, 1, 0.36, 1],
  /** symmetric, for interruptions */
  inOut: [0.4, 0, 0.2, 1],
};

const BASE_SPRING = {
  /** small UI pops (clear button, icons) - slight overshoot */
  pop: { type: "spring", stiffness: 520, damping: 26, mass: 0.7 },
  /** no-overshoot spring for larger surfaces */
  soft: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
};

export const SPRING = {
  pop: scaleSpring(BASE_SPRING.pop),
  soft: scaleSpring(BASE_SPRING.soft),
};

/** Product card entrance (fade + rise) */
export const CARD_ENTER = {
  /** vertical offset the card rises from, in px */
  y: 14,
  duration: DURATION.base,
  ease: EASE.out,
  /** delay between two cards of the same batch, in seconds */
  stagger: scaled(0.04),
  /** cards after this position inside a batch are rendered without animation */
  maxStaggered: 12,
};

/**
 * True when the device is weak enough that we skip the heavier motion
 * (staggered grid entrance). Both signals are Chrome-only/optional, so an
 * unknown value never counts as low-end.
 *
 * Note: the threshold is `<= 2` on purpose - many perfectly capable desktops
 * report 4 cores, and silently disabling the entrance there would hide the
 * very behaviour this pilot is meant to evaluate.
 *
 * In promo/capture mode the check is bypassed entirely: the animations are the
 * thing being recorded (see ./promo.js).
 */
export function isLowEndDevice() {
  if (isPromoMode) return false;
  if (typeof navigator === "undefined") return false;

  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;

  return (
    (typeof memory === "number" && memory <= 2) ||
    (typeof cores === "number" && cores <= 2)
  );
}
