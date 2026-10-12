import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  getReplayToken,
  isPromoMode,
  promo,
  requestReplay,
  setPromoParam,
  subscribeReplay,
} from "../motion/promo";

/**
 * React view of capture ("promo") mode - see `motion/promo.js` for the URL
 * contract. Reading it through a hook keeps Home.jsx honest: the flag is parsed
 * once per page load, and `replayToken` lets the capture bar restart the
 * entrance animations in place.
 *
 * @returns {{
 *   enabled: boolean,
 *   speed: number,
 *   replayToken: number,
 *   replay: () => void,
 *   setSpeed: (value: number|string) => void,
 * }}
 */
export default function usePromoMode() {
  const replayToken = useSyncExternalStore(subscribeReplay, getReplayToken, getReplayToken);
  const replay = useCallback(() => requestReplay(), []);

  return useMemo(
    () => ({
      enabled: isPromoMode,
      speed: promo.speed,
      replayToken,
      replay,
      setSpeed: setPromoParam,
    }),
    [replayToken, replay]
  );
}
