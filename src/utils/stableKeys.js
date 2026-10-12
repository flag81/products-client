import { toIdString } from "./idUtils";

/**
 * Builds React keys that identify a product card by *content*
 * (productId + storeId) instead of by list position.
 *
 * Why: index-based keys ("onsale-3") make React reuse the DOM node of a
 * completely different product when the result list changes - the card then
 * cannot play an entrance animation, because from React's point of view nothing
 * was added. Duplicate productId+storeId pairs (possible when the API returns
 * the same product in two rows) get a deterministic suffix so keys stay unique
 * even then.
 *
 * @returns {Array<{product: any, key: string, index: number}>} same order/length as `products`
 */
export function buildStableCardKeys(products, prefix = "card") {
  const occurrences = new Map();

  return (products || []).map((product, index) => {
    const productId = toIdString(product?.productId) || "unknown";
    const storeId = toIdString(product?.storeId) || "unknown";
    const base = `${prefix}-${productId}-${storeId}`;

    const count = occurrences.get(base) || 0;
    occurrences.set(base, count + 1);

    return {
      product,
      key: count === 0 ? base : `${base}-${count}`,
      index,
    };
  });
}
