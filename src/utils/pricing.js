export function getDisplayDiscountPercentage(product) {
  const explicit = product?.discount_percentage;
  if (explicit !== null && explicit !== undefined && explicit !== "") {
    const explicitNumber = Number(explicit);
    return Number.isFinite(explicitNumber) ? Math.ceil(explicitNumber) : null;
  }

  const oldPrice = Number.parseFloat(product?.old_price);
  const newPrice = Number.parseFloat(product?.new_price);
  if (!Number.isFinite(oldPrice) || !Number.isFinite(newPrice)) return null;
  if (oldPrice <= 0) return null;
  if (newPrice < 0) return null;
  if (newPrice >= oldPrice) return null;

  const pct = ((oldPrice - newPrice) / oldPrice) * 100;
  return Number.isFinite(pct) ? Math.ceil(pct) : null;
}
