/* eslint-disable react/prop-types */
import Button from "react-bootstrap/Button";

export default function StoreScroller({
  stores,
  selectedStores,
  onToggleStore,
  onDeselectStore,
  storeScrollRef,
  canScrollLeft,
  canScrollRight,
  onScrollBy,
}) {
  const cardSize = 74;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        background: "linear-gradient(180deg, #f1f2f4 0%, #e7e8eb 100%)",
        borderRadius: 14,
        border: "1px solid #cfd3da",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
        padding: "6px 0",
      }}
    >
      {/* Desktop arrows (do not reserve space) */}
      {canScrollLeft && (
        <Button
          type="button"
          variant="light"
          className="d-inline-flex"
          aria-label="Scroll stores left"
          onClick={() => onScrollBy(-1)}
          style={{
            position: "absolute",
            left: 6,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 4,
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            lineHeight: 1,
            border: "1px solid #d2d6dd",
            boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
            opacity: 0.95,
          }}
        >
          ‹
        </Button>
      )}

      <div
        id="store-filter-container"
        ref={storeScrollRef}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
          margin: "0",
          padding: "2px 0",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: "grab",
          paddingLeft: canScrollLeft ? 44 : 8,
          paddingRight: canScrollRight ? 44 : 8,
          overscrollBehaviorX: "contain",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
          scrollPaddingInlineStart: canScrollLeft ? 44 : 8,
        }}
      >
        {(stores || []).map((store) => {
          const idStr = String(store.storeId);
          const isSelected = (selectedStores || []).includes(idStr);

          return (
            <div
              key={store.storeId}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => onToggleStore(idStr)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleStore(idStr);
                }
              }}
              title={store.storeName || "Store"}
              style={{
                position: "relative",
                width: cardSize,
                height: 64,
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#333",
                borderRadius: 10,
                padding: 6,
                cursor: "pointer",
                margin: "0 4px",
                border: isSelected ? "1px solid #6ea5ff" : "1px solid #d7dbe2",
                boxShadow: isSelected
                  ? "0 0 0 2px rgba(46,120,255,0.22), 0 6px 12px rgba(24,94,214,0.14)"
                  : "0 1px 4px rgba(0,0,0,0.06)",
                transform: isSelected ? "translateY(-2px)" : "none",
                transition: "box-shadow 180ms ease, transform 120ms ease, border-color 180ms ease",
                verticalAlign: "middle",
                background: "#ffffff",
                scrollSnapAlign: "start",
                overflow: "hidden",
              }}
            >
              {isSelected && (
                <button
                  type="button"
                  aria-label={`Deselect ${store.storeName || "store"}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeselectStore(idStr);
                  }}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    border: "1px solid #aeb8c7",
                    background: "white",
                    color: "#df2e38",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    lineHeight: 1,
                    padding: 0,
                    zIndex: 3,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              )}

              {store.logoUrl ? (
                <img
                  src={`${store.logoUrl.replace("/upload/", "/upload/f_auto,q_auto:best,dpr_auto,c_limit,w_160,h_96/")}`}
                  alt={store.storeName || "Store"}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: 58,
                    maxHeight: 36,
                    objectFit: "contain",
                    display: "block",
                  }}
                  loading="lazy"
                />
              ) : (
                <span
                  style={{
                    color: "#213547",
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                  }}
                >
                  {(store.storeName || "N/A").slice(0, 8)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {canScrollRight && (
        <Button
          type="button"
          variant="light"
          className="d-inline-flex"
          aria-label="Scroll stores right"
          onClick={() => onScrollBy(1)}
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 4,
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            lineHeight: 1,
            border: "1px solid #d2d6dd",
            boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
            opacity: 0.95,
          }}
        >
          ›
        </Button>
      )}
    </div>
  );
}
