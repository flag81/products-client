export function toIdString(value) {
  return value === null || value === undefined ? "" : String(value);
}

/**
 * Filters `items` removing those whose id exists in `existing`.
 * Comparison is done by stringified id to avoid number/string mismatches.
 */
export function filterOutExistingById(items, existing, getItemId, getExistingId) {
  const existingIdSet = new Set((existing || []).map((e) => toIdString(getExistingId(e))));
  return (items || []).filter((item) => !existingIdSet.has(toIdString(getItemId(item))));
}
