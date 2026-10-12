// Online price check API (server: GET /online-price-check, GET /online-price-shops).
// Public endpoints - no auth needed, so plain fetch + nodeUrl like homeApi.js.

function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  return search.toString();
}

async function readError(response, fallbackMessage) {
  try {
    const data = await response.json();
    if (data?.error) return data.error;
  } catch {
    // not JSON - keep the fallback
  }
  return fallbackMessage;
}

export async function fetchOnlinePriceCheck(nodeUrl, { keyword, storeIds, limit, refresh } = {}) {
  const trimmedKeyword = String(keyword || "").trim();
  if (trimmedKeyword.length < 2) {
    throw new Error("Kërkimi është shumë i shkurtër.");
  }

  const storeIdsValue = Array.isArray(storeIds) ? storeIds.join(",") : String(storeIds || "").trim();
  const query = buildQuery({
    keyword: trimmedKeyword,
    storeIds: storeIdsValue,
    limit,
    refresh: refresh ? "1" : "",
  });

  const response = await fetch(`${nodeUrl}/online-price-check?${query}`);
  if (!response.ok) {
    throw new Error(await readError(response, `Kontrolli i çmimeve dështoi (${response.status}).`));
  }
  return response.json();
}

export async function fetchOnlinePriceShops(nodeUrl) {
  const response = await fetch(`${nodeUrl}/online-price-shops`);
  if (!response.ok) {
    throw new Error(`Nuk mund të lexohen dyqanet online (${response.status}).`);
  }
  const data = await response.json();
  return Array.isArray(data?.shops) ? data.shops : [];
}

/** 1.39 -> "1,39 €" (Kosovo-style decimal comma). */
export function formatOnlinePrice(value, currency = "EUR") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  const amount = Number(value).toFixed(2).replace(".", ",");
  const symbol = String(currency || "EUR").toUpperCase() === "EUR" ? "€" : currency;
  return `${amount} ${symbol}`;
}

export function formatOnlinePriceTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
