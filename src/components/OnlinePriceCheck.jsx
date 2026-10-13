import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { fetchOnlinePriceCheck, formatOnlinePrice, formatOnlinePriceTime } from "../api/onlinePriceApi";
import { buildProductImageUrl } from "../utils/cloudinary";

// "Çmimi i rregullt online" panel: the regular (non-discounted) prices a product
// has in the shops' own online shops. It is rendered after the product results
// for every keyword search, never as a discount, so the prices here must not use
// the red/orange discount palette used everywhere else in the app.
//
// The expired flyer deals ("Te skaduara") the keyword matched are rendered by this
// same component too, but as their own block *before* the panel: they are flyer
// prices, not shop prices, so they show both prices (offer + full price) and the
// day the deal ended, and their small thumbnail opens the big image like a product
// card does.
//
// The block lists every match the keyword found (no cap) and spans the same width
// as the on-sale cards grid above it - and so does the panel itself: neither block
// truncates its rows anymore, both are as wide as the cards band.
//
// `ONLINE_PRICE_LIMIT` is how many matches the client asks the server for per shop.
// It is the server's own ceiling (`MAX_LIMIT` in services/onlinePriceService.js),
// so a shop with even more matches is cut there, not in this component.
const ONLINE_PRICE_LIMIT = 50;

const styles = {
  // Same width as the on-sale cards grid (and the expired block) above it - see
  // the comment on `expiredWrapper` below for why width:100% + border-box is
  // exactly that band. No 90% centered box: the panel is a full-width section.
  wrapper: {
    width: "100%",
    boxSizing: "border-box",
    margin: "12px 0",
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
  // "Te skaduara" block: expired flyer deals. It is its own block, rendered before
  // the shops panel, but it reuses the panel's row layout: thumbnail + name on the
  // left, prices on the right. The warm border marks it as a separate section.
  // Full width, exactly like the on-sale cards grid above it: the grid row is a
  // direct child of the scroll container and bleeds 4px on each side through
  // Bootstrap's negative gutters, which the container clips - so the band you see
  // is the container's content width, which is what width:100% + border-box gives.
  expiredWrapper: {
    width: "100%",
    boxSizing: "border-box",
    margin: "12px 0",
    flexShrink: 0,
    border: "1px solid #ead2d0",
    borderRadius: 8,
    background: "#fdf7f6",
    padding: "12px 14px",
    textAlign: "left",
  },
  // The rows sit on a white card so they stay readable on the tinted block.
  expiredCard: {
    marginTop: 8,
    background: "#fff",
    border: "1px solid #dfe6ef",
    borderRadius: 8,
    padding: "10px 12px",
  },
  dealHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  dealTitle: { fontWeight: 700, color: "#1d3d72", fontSize: 14.5 },
  dealNote: { fontSize: 11.5, color: "#6b7a90" },
  dealCount: { fontSize: 11.5, color: "#a33535", fontWeight: 700 },
  dealMeta: { fontSize: 11, color: "#a33535", fontWeight: 700 },
  thumbZoom: { flex: "0 0 auto", display: "inline-flex", cursor: "zoom-in" },
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

// Same 44px tile as the shop items, but wrapped in the zoom overlay the product
// cards use, so clicking the small image loads the big one.
function ExpiredThumbnail({ imageUrl, alt }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) return <span aria-hidden="true" style={styles.thumbEmpty} />;

  return (
    <span style={styles.thumbZoom} title="Kliko për imazhin e madh">
      <Zoom>
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          style={styles.thumb}
        />
      </Zoom>
    </span>
  );
}

ExpiredThumbnail.propTypes = {
  imageUrl: PropTypes.string,
  alt: PropTypes.string,
};

const STATUS_FALLBACK = {
  empty: "Asnjë produkt nuk u gjet në dyqanin online.",
  error: "Dyqani online nuk u përgjigj.",
};

// Expired flyer deals ("Te skaduara") the keyword matched, in the panel's compact
// row layout: both prices (the expired offer price + the full price) and the day
// the deal ended. Rendered above the shops panel as its own block, listing every
// match the keyword found.
function ExpiredDeals({ products, baseUrl, autoTransformation, directory }) {
  const rows = (Array.isArray(products) ? products : []).filter((product) => product?.product_description);
  if (rows.length === 0) return null;

  return (
    <section id="expired-deals" style={styles.expiredWrapper} aria-label="Te skaduara">
      <div style={styles.dealHeader}>
        <div>
          <div style={styles.dealTitle}>Te skaduara</div>
          <div style={styles.dealNote}>
            Oferta të fletushkave që kanë skaduar (çmimi i ofertës + çmimi i plotë).
          </div>
        </div>
        <span style={styles.dealCount}>{rows.length} artikuj</span>
      </div>

      <div style={styles.expiredCard}>
        <ul style={styles.list}>
          {rows.map((product, index) => (
            <li key={`${product.productId}-${index}`} style={styles.item}>
              <ExpiredThumbnail
                imageUrl={
                  buildProductImageUrl({
                    imageUrl: product.image_url,
                    baseUrl,
                    autoTransformation,
                    directory,
                  }) || product.image_url
                }
                alt={product.product_description}
              />

              <div style={styles.itemMain}>
                <span style={styles.itemLink}>{product.product_description}</span>
                <div style={styles.itemMeta}>
                  {[product.storeName, product.city].filter(Boolean).join(" · ")}
                </div>
              </div>

              <div style={styles.priceBox}>
                {Number(product.new_price) > 0 && (
                  <span style={styles.price}>{formatOnlinePrice(product.new_price, "EUR")}</span>
                )}
                {Number(product.old_price) > 0 && (
                  <span style={styles.oldPrice}>{formatOnlinePrice(product.old_price, "EUR")}</span>
                )}
                <div style={styles.dealMeta}>
                  {product.sale_end_date ? `Skaduar ${formatShortDate(product.sale_end_date)}` : "Skaduar"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

ExpiredDeals.propTypes = {
  products: PropTypes.arrayOf(PropTypes.object),
  baseUrl: PropTypes.string,
  autoTransformation: PropTypes.string,
  directory: PropTypes.string,
};

/** "2026-09-12" -> "12/09/26" - the same short format the product cards use. */
function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function OnlinePriceCheck({
  keyword,
  storeIds,
  nodeUrl,
  expiredProducts = [],
  baseUrl,
  autoTransformation,
  directory,
  autoCheck = true,
}) {
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
        limit: ONLINE_PRICE_LIMIT,
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
    <>
      {/* Expired flyer deals for the keyword. Their own block, rendered before the
          shops panel because they are flyer prices, not shop prices. Independent of
          the shop request, so they show while it is loading or when it failed. */}
      <ExpiredDeals
        products={expiredProducts}
        baseUrl={baseUrl}
        autoTransformation={autoTransformation}
        directory={directory}
      />

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
              // Every item the shop returned is rendered - no per-shop row cap. The
              // only ceiling left is the request limit above, which is the server's.
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
                      {items.map((item) => (
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

OnlinePriceCheck.propTypes = {
  keyword: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  storeIds: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]),
  nodeUrl: PropTypes.string.isRequired,
  expiredProducts: PropTypes.arrayOf(PropTypes.object),
  baseUrl: PropTypes.string,
  autoTransformation: PropTypes.string,
  directory: PropTypes.string,
  autoCheck: PropTypes.bool,
};
