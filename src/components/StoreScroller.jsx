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
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        background: "#d7d8db",
        borderRadius: 10,
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
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            lineHeight: 1,
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
          margin: "10px 0",
          padding: "2px 0",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: "grab",
          paddingLeft: canScrollLeft ? 40 : 0,
          paddingRight: canScrollRight ? 40 : 0,
          overscrollBehaviorX: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {(stores || []).map((store) => {
          const idStr = String(store.storeId);
          const isSelected = (selectedStores || []).includes(idStr);

          return (
            <div
              key={store.storeId}
              role="button"
              aria-pressed={isSelected}
              onClick={() => onToggleStore(idStr)}
              style={{
                position: "relative",
                width: 72,
                height: 72,
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#333",
                borderRadius: 8,
                padding: 8,
                cursor: "pointer",
                margin: "0 2px",
                border: isSelected ? "2px solid #0d6efd" : "1px solid #c6c4c4",
                boxShadow: isSelected ? "0 4px 12px rgba(13,110,253,0.15)" : "none",
                transform: isSelected ? "translateY(-2px)" : "none",
                transition: "box-shadow 150ms ease, transform 120ms ease, border-color 150ms ease",
                verticalAlign: "middle",
                background: "white",
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
                    top: 2,
                    right: 2,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    border: "1px solid #ccc",
                    background: "white",
                    color: "red",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
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
                  src={`${store.logoUrl.replace("/upload/", "/upload/w_100,c_scale/")}`}
                  alt={store.storeName || "Store"}
                  style={{
                    maxWidth: "100%",
                    maxHeight: 56,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : (
                <span style={{ color: "black", marginRight: 5 }}>{store.storeName || "N/A"}</span>
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
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ›
        </Button>
      )}
    </div>
  );
}
