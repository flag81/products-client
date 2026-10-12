import { useCallback, useEffect, useState } from "react";
import { PROMO_SPEEDS } from "../motion/promo";
import usePromoMode from "../hooks/usePromoMode";

/**
 * Floating capture bar for promo/localized recordings. Rendered only when the
 * page was opened with `?promo=<speed>` (see `motion/promo.js`), so it is a
 * no-op - literally nothing in the tree - for real users.
 *
 * Recording flow: press R (or the button) to replay the card entrance, H to
 * hide the bar so it does not show in the take.
 */
export default function PromoControls() {
  const { enabled, speed, replay, setSpeed } = usePromoMode();
  const [visible, setVisible] = useState(true);

  const replayFromTop = useCallback(() => {
    // Put the animated area back at the top first, otherwise a replay while
    // scrolled down only animates half of the screen.
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      const scroller = document.querySelector(".hide-scrollbar");
      if (scroller) scroller.scrollTop = 0;
    }
    // Let the browser paint the top-of-list state before restarting, so the
    // first frame of the take shows the "hidden" card state.
    window.setTimeout(replay, 120);
  }, [replay]);

  const focusSearch = useCallback(() => {
    const input =
      document.getElementById("search-desktop") || document.getElementById("search");
    if (input && typeof input.focus === "function") input.focus();
  }, []);

  const cycleSpeed = useCallback(() => {
    const index = PROMO_SPEEDS.indexOf(speed);
    setSpeed(PROMO_SPEEDS[(index + 1) % PROMO_SPEEDS.length]);
  }, [setSpeed, speed]);

  const reload = useCallback(() => window.location.reload(), []);

  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      // While typing in the search field every keystroke belongs to the take.
      const tag = event.target && event.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (event.key.toLowerCase()) {
        case "r":
          event.preventDefault();
          replayFromTop();
          break;
        case "f":
          event.preventDefault();
          focusSearch();
          break;
        case "s":
          event.preventDefault();
          cycleSpeed();
          break;
        case "h":
          event.preventDefault();
          setVisible((current) => !current);
          break;
        case "l":
          event.preventDefault();
          reload();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cycleSpeed, enabled, focusSearch, reload, replayFromTop]);

  if (!enabled) return null;

  if (!visible) {
    return (
      <button
        type="button"
        className="promo-bar-show"
        onClick={() => setVisible(true)}
        title="Show capture controls (H)"
      >
        promo
      </button>
    );
  }

  return (
    <div className="promo-bar" role="toolbar" aria-label="Promo capture controls">
      <span className="promo-bar__label">promo {speed}×</span>
      <button type="button" onClick={replayFromTop} title="Replay the entrance animation (R)">
        Replay <kbd>R</kbd>
      </button>
      <button type="button" onClick={focusSearch} title="Focus the search bar (F)">
        Focus <kbd>F</kbd>
      </button>
      <button type="button" onClick={cycleSpeed} title="Cycle the speed multiplier (S)">
        Speed <kbd>S</kbd>
      </button>
      <button type="button" onClick={reload} title="Reload from the first paint (L)">
        Reload <kbd>L</kbd>
      </button>
      <button type="button" onClick={() => setVisible(false)} title="Hide during recording (H)">
        Hide <kbd>H</kbd>
      </button>
    </div>
  );
}
