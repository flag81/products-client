/**
 * Shared Motion variants for the Home pilot (search bar + product cards).
 * Only `transform` and `opacity` are animated so the browser can keep these on
 * the compositor - important because the product grid lives inside an inner
 * scroll container (`productsScrollRef`), not the window.
 */
import { CARD_ENTER, DURATION, EASE, SPRING } from "./tokens";

/**
 * Product card entrance.
 * `custom` carries the per-card delay (seconds) computed by `useCardEntrance`.
 */
export const cardVariants = {
  hidden: { opacity: 0, y: CARD_ENTER.y },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: CARD_ENTER.duration, ease: CARD_ENTER.ease, delay },
  }),
};

/** "Clear search" (x) button: pops in, spins out. */
export const clearButtonVariants = {
  hidden: { opacity: 0, scale: 0.4, rotate: -90 },
  visible: { opacity: 1, scale: 1, rotate: 0, transition: SPRING.pop },
  exit: {
    opacity: 0,
    scale: 0.4,
    rotate: 90,
    transition: { duration: DURATION.fast, ease: EASE.inOut },
  },
};

/** Soft glow drawn around the search input while it is focused. */
export const focusRingVariants = {
  idle: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: DURATION.fast, ease: EASE.inOut },
  },
  focused: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE.out },
  },
};

/**
 * Results banner ("U gjet N artikuj per ...").
 * The exit is opacity-only and fast on purpose: the banner is also hidden while
 * a search request is in flight, so a slow exit would pulse on every keystroke.
 */
export const bannerVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE.out },
  },
  exit: { opacity: 0, transition: { duration: 0.12, ease: EASE.inOut } },
};

/**
 * Tap feedback.
 *
 * The explicit `transition` (instead of Motion's built-in default spring) is
 * what makes the press feedback respect the promo speed multiplier: without it,
 * taps would still snap at full speed inside a slow-motion take.
 */
/** Tap feedback for the small card icons (flyer, share). */
export const ICON_TAP = { scale: 0.82, transition: SPRING.pop };

/** Tap feedback for the favorite star: slightly deeper, with a twist. */
export const STAR_TAP = { scale: 0.78, rotate: -14, transition: SPRING.pop };

/** Tap feedback for a whole product card (mobile press). */
export const CARD_TAP = { scale: 0.97, transition: SPRING.soft };
