function toKeyString(key) {
  return key === null || key === undefined ? "" : String(key);
}

export function dedupeByKey(items, getKey) {
  const seen = new Set();
  const out = [];

  for (const item of items || []) {
    const key = getKey(item);
    if (key === null || key === undefined || key === "") continue;
    const keyStr = toKeyString(key);
    if (seen.has(keyStr)) continue;
    seen.add(keyStr);
    out.push(item);
  }

  return out;
}

// Project-specific helper: dedupe photo objects by image identity.
export function dedupePhotosByImageIdOrUri(photos) {
  return dedupeByKey(photos, (photo) => photo?.imageId ?? photo?.uri ?? photo?.image);
}
