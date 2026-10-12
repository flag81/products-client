import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { fetchOnlinePriceCheck, formatOnlinePrice, formatOnlinePriceTime } from "../api/onlinePriceApi";

// "Çmimi i rregullt online" panel: the regular (non-discounted) prices a product
// has in the shops' own online shops. It is rendered after the product results
// for every keyword search, never as a discount, so the prices here must not use
// the red/orange discount palette used everywhere else in the app.
const MAX_ITEMS_PER_SHOP = 6;

const styles = {
  wrapper: {
    width: "90%",
    margin: "12px auto",
    flexShrink: 0, // stay fully visible/scrollable inside the app's scroll container
    border: "1px solid #bcd6f7",
    borderRadius: 8,
    background: "#f4f9ff",
    padding: "12px 14px",
    textAlign: "left",
  },
  header: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 16, fontWeight: 700, color: "#1d3d72" },
  subtitle: { fontSize: 12.5, color: "#4a5b73", marginTop: 2 },
  button: {
    border: "1px solid #1d3d72",
    background: "#1d3d72",
    color: "#fff",
    borderRadius: 6,
    padding: "7px 14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonDisabled: { opacity: 0.6, cursor: "default" },
  info: { marginTop: 10, fontSize: 13.5, color: "#4a5b73" },
  error: { marginTop: 10, fontSize: 13.5, color: "#a33535", fontWeight: 600 },
  shops: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 },
  shopCard: {
    background: "#fff",
    border: "1px solid #dfe6ef",
    borderRadius: 8,
    padding: "10px 12px",
  },
  shopHeader: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  shopLogo: { height: 24, width: 24, objectFit: "contain", borderRadius: 4, background: "#fff" },
  shopName: { fontWeight: 700, color: "#1d3d72", fontSize: 14.5 },
  shopMeta: { fontSize: 11.5, color: "#6b7a90" },
  shopMessage: { marginTop: 6, fontSize: 13, color: "#6b7a90" },
  list: { listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  item: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid #f0f3f8",
    paddingTop: 6,
  },
  itemMain: { flex: 1, minWidth: 0 },
  itemLink: { color: "#1d3d72", textDecoration: "none", fontSize: 13.5, lineHeight: 1.35 },
  thumbLink: { flex: "0 0 auto", display: "inline-flex" },
  thumb: {
    width: 44,
    height: 44,
    objectFit: "contain",
    display: "block",
    borderRadius: 6,
    border: "1px solid #e3eaf3",
    background: "#fff",
  },
  // Placeholder for items a shop has no image for (or whose hotlink fails): keeps
  // the text of every row aligned with the rows that do show a thumbnail.
  thumbEmpty: {
    width: 44,
    height: 44,
    display: "block",
    borderRadius: 6,
    border: "1px dashed #dfe6ef",
    background: "#f7fafd",
  },
  priceBox: { textAlign: "right", whiteSpace: "nowrap" },
  price: { fontWeight: 700, color: "#0f5132", fontSize: 14 },
  oldPrice: { color: "#8a94a6", textDecoration: "line-through", fontSize: 12, marginLeft: 6 },
  itemMeta: { fontSize: 11, color: "#8a94a6" },
};

// Thumbnails are hotlinked straight from the shops (no proxy, no re-upload):
// `no-referrer` keeps their hotlink protection happy, `lazy` keeps a long list of
// shops cheap, and a missing/failed file falls back to an empty tile so every row
// stays aligned instead of showing a broken-image icon.
function Thumbnail({ imageUrl, productUrl, alt }) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(imageUrl) && !failed;

  const tile = hasImage ? (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={styles.thumb}
    />
  ) : (
    <span aria-hidden="true" style={styles.thumbEmpty} />
  );

  if (!productUrl) return tile;
  return (
    <a href={productUrl} target="_blank" rel="noopener noreferrer" title={alt} style={styles.thumbLink}>
      {tile}
    </a>
  );
}

Thumbnail.propTypes = {
  imageUrl: PropTypes.string,
  productUrl: PropTypes.string,
  alt: PropTypes.string,
};

const STATUS_FALLBACK = {
  empty: "Asnjë produkt nuk u gjet në dyqanin online.",
  error: "Dyqani online nuk u përgjigj.",
};

export default function OnlinePriceCheck({ keyword, storeIds, nodeUrl, autoCheck = true }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const attemptedRef = useRef("");
  const requestIdRef = useRef(0);

  const trimmedKeyword = String(keyword || "").trim();
  const storeIdsValue = Array.isArray(storeIds) ? storeIds.join(",") : String(storeIds || "").trim();

  const runCheck = async (refresh = false) => {
    if (trimmedKeyword.length < 2) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchOnlinePriceCheck(nodeUrl, {
        keyword: trimmedKeyword,
        storeIds: storeIdsValue,
        limit: MAX_ITEMS_PER_SHOP * 3,
        refresh,
      });
      if (requestIdRef.current !== requestId) return; // a newer keyword won
      setData(result);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setData(null);
      setError(err?.message || "Kontrolli i çmimeve dështoi.");
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  };

  // A new search invalidates everything the panel shows.
  useEffect(() => {
    attemptedRef.current = "";
    requestIdRef.current += 1;
    setData(null);
    setError(null);
    setLoading(false);
  }, [trimmedKeyword, storeIdsValue]);

  // Auto-check once per keyword (the panel is shown for every search).
  useEffect(() => {
    if (!autoCheck || trimmedKeyword.length < 2) return;
    const attemptKey = `${trimmedKeyword}|${storeIdsValue}`;
    if (attemptedRef.current === attemptKey) return;
    attemptedRef.current = attemptKey;
    runCheck(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheck, trimmedKeyword, storeIdsValue]);

  if (trimmedKeyword.length < 2) return null;

  const shops = Array.isArray(data?.shops) ? data.shops : [];
  const checked = Boolean(data);

  return (
    <div id="online-price-check" style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Çmimi i rregullt online</div>
          <div style={styles.subtitle}>
            Çmimet e rregullta të dyqaneve online (nuk janë ofertë/zbritje).
          </div>
        </div>
        <button
          type="button"
          onClick={() => runCheck(checked)}
          disabled={loading}
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : null) }}
        >
          {loading ? "Duke kontrolluar..." : checked ? "Rifresko çmimet" : "Kontrollo çmimin online"}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {!error && data?.message && <div style={styles.info}>{data.message}</div>}

      {!error && shops.length > 0 && (
        <div style={styles.shops}>
          {shops.map((shop) => {
            const items = Array.isArray(shop.items) ? shop.items : [];
            const visibleItems = items.slice(0, MAX_ITEMS_PER_SHOP);
            return (
              <div key={`${shop.shopId}-${shop.storeId}`} style={styles.shopCard}>
                <div style={styles.shopHeader}>
                  {shop.logoUrl && (
                    <img src={shop.logoUrl} alt={shop.storeName || shop.label} style={styles.shopLogo} />
                  )}
                  <span style={styles.shopName}>{shop.storeName || shop.label}</span>
                  <span style={styles.shopMeta}>
                    {shop.status === "error" ? "pa përgjigje" : shop.cached ? "nga cache" : "live"}
                    {shop.fetchedAt ? ` · ${formatOnlinePriceTime(shop.fetchedAt)}` : ""}
                    {shop.shopUrl ? ` · ${shop.shopUrl.replace(/^https?:\/\//, "")}` : ""}
                  </span>
                </div>

                {shop.status === "error" ? (
                  <div style={styles.shopMessage}>{shop.message || STATUS_FALLBACK.error}</div>
                ) : items.length === 0 ? (
                  <div style={styles.shopMessage}>{shop.message || STATUS_FALLBACK.empty}</div>
                ) : (
                  <ul style={styles.list}>
                    {visibleItems.map((item) => (
                      <li
                        key={`${item.name}-${item.productUrl || ""}-${item.imageUrl || ""}`}
                        style={styles.item}
                      >
                        <Thumbnail
                          imageUrl={item.imageUrl}
                          productUrl={item.productUrl}
                          alt={item.name}
                        />
                        <div style={styles.itemMain}>
                          {item.productUrl ? (
                            <a
                              href={item.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.itemLink}
                            >
                              {item.name}
                            </a>
                          ) : (
                            <span>{item.name}</span>
                          )}
                          {(item.unit || item.barcode) && (
                            <div style={styles.itemMeta}>
                              {[item.unit, item.barcode].filter(Boolean).join(" · ")}
                            </div>
                          )}
                        </div>
                        <div style={styles.priceBox}>
                          <span style={styles.price}>{formatOnlinePrice(item.price, item.currency)}</span>
                          {item.oldPrice !== null && item.oldPrice !== undefined && (
                            <span style={styles.oldPrice}>
                              {formatOnlinePrice(item.oldPrice, item.currency)}
                            </span>
                          )}
                          <div style={styles.itemMeta}>{item.inStock ? "Në gjendje" : "Pa gjendje"}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {items.length > visibleItems.length && (
                  <div style={styles.shopMessage}>
                    +{items.length - visibleItems.length} rezultate të tjera
                    {shop.shopUrl ? " në dyqanin online" : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

OnlinePriceCheck.propTypes = {
  keyword: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  storeIds: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]),
  nodeUrl: PropTypes.string.isRequired,
  autoCheck: PropTypes.bool,
};
