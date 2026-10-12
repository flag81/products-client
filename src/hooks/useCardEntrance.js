import { useEffect, useMemo, useRef } from "react";
import { CARD_ENTER, isLowEndDevice } from "../motion/tokens";

/** Shared "nothing is on screen yet" set - never mutated, so it can be reused. */
const EMPTY_SET = new Set();

/**
 * Decides which product cards should play the entrance animation.
 *
 * A card animates only the first time its key appears in the list, so:
 *   - first page / new search / new filter  -> the first batch animates (staggered)
 *   - "load more" (infinite query)          -> only the appended cards animate
 *   - unrelated re-renders (favorite click) -> nothing re-animates
 *
 * The seen-set is a ref that is updated *after* commit inside an effect. Doing
 * it during render would break under React 18 StrictMode, which renders the
 * component twice: the first pass would already mark every card as "seen" and
 * the entrance would never play in dev.
 *
 * @param {string[]} keys ordered keys of the rendered cards
 * @param {{disabled?: boolean, resetKey?: string, replayToken?: number}} options
 *        disabled - reduced motion / low-end device: skip the stagger entirely
 *        (transform animations are suppressed by MotionConfig anyway, so an
 *        animation would degrade to a delayed fade).
 *        resetKey - identity of the current *result set* (Home passes the
 *        React Query key). When it changes - new keyword, new store/favorite/
 *        on-sale filter - every card counts as new again, so a fresh result set
 *        animates even when it contains products that were on screen before.
 *        Appending a page keeps the same resetKey, so only the appended cards
 *        animate.
 *        replayToken - monotonically increasing counter bumped by the promo
 *        capture bar (`?promo`, see motion/promo.js). Every change makes each
 *        rendered card count as new again, which is what replays the entrance
 *        on demand for a recording. Cards are remounted by ProductCard on the
 *        same token, so `initial="hidden"` runs again.
 * @returns {Array<{animate: boolean, delay: number}>} parallel to `keys`
 */
export default function useCardEntrance(
  keys,
  { disabled = false, resetKey = "", replayToken = 0 } = {}
) {
  const seenRef = useRef(new Set());
  const resetKeyRef = useRef(resetKey);
  const replayRef = useRef(replayToken);
  const lowEnd = useMemo(() => isLowEndDevice(), []);
  const motionOff = disabled || lowEnd;

  // A replay request or a new result set means "nothing is on screen yet", so
  // every card is allowed to animate again.
  const replaying = replayRef.current !== replayToken;
  const previousKeys = replaying
    ? EMPTY_SET
    : resetKeyRef.current === resetKey
      ? seenRef.current
      : EMPTY_SET;

  const entrances = [];
  let batchIndex = 0;

  for (const key of keys || []) {
    const isNew = !previousKeys.has(key);
    const shouldAnimate =
      !motionOff && isNew && batchIndex <= CARD_ENTER.maxStaggered;

    if (shouldAnimate) {
      entrances.push({ animate: true, delay: batchIndex * CARD_ENTER.stagger });
      batchIndex += 1;
    } else {
      // Already on screen (or past the stagger budget): render in final state.
      entrances.push({ animate: false, delay: 0 });
    }
  }

  // Runs after every commit: the next render compares against what is on screen
  // now. No dependency array on purpose - the keys array is recreated per render.
  useEffect(() => {
    seenRef.current = new Set(keys || []);
    resetKeyRef.current = resetKey;
    replayRef.current = replayToken;
  });

  return entrances;
}
