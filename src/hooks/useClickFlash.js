import { useEffect } from "react";
import { promoTimeScale } from "../motion/promo";

/** Class the CSS animations hang off (see styles/motion.css). */
const FLASH_CLASS = "click-flash";
/** Longest flash animation (280ms) plus headroom, before the capture speed. */
const BASE_WINDOW_MS = 520;

/**
 * Click flash: a short bright pulse + halo on the icons that actually do
 * something (favourite star, share, flyer, bell, favourites filter, profile,
 * clear search, back to top).
 *
 * One delegated listener for the whole app instead of state inside every icon:
 * no re-render per tap, and a new icon only needs `data-flash` on the clickable
 * element. The look itself is pure CSS (styles/motion.css): it animates
 * `filter` only, so it works on an svg, an img or a text label alike and never
 * fights the Motion `whileTap` transform on the same element. The window is
 * stretched by the capture speed, so a slow-motion take (?promo=0.5) shows the
 * flash slowed down like every other timed animation.
 */
export default function useClickFlash() {
  useEffect(() => {
    /** One timer per host, so a rapid second tap restarts the flash. */
    const timers = new WeakMap();

    const flash = (host) => {
      const previous = timers.get(host);
      if (previous) window.clearTimeout(previous);

      // Remove + reflow + add, so tapping twice replays the animation instead of
      // silently continuing the one already running.
      host.classList.remove(FLASH_CLASS);
      void host.offsetWidth;
      host.classList.add(FLASH_CLASS);

      timers.set(
        host,
        window.setTimeout(() => {
          host.classList.remove(FLASH_CLASS);
          timers.delete(host);
        }, BASE_WINDOW_MS * promoTimeScale())
      );
    };

    const onPointerDown = (event) => {
      if (event.button !== 0) return; // primary button / touch only
      const host = event.target?.closest?.("[data-flash]");
      if (host) flash(host);
    };

    // pointerdown rather than click: the flash should start on press, together
    // with the existing tap feedback.
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);
}
