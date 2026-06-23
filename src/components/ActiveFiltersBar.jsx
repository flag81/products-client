import React from "react";

export default function ActiveFiltersBar({
  isFavorite,
  onClearFavorite,
  onSale,
  onClearOnSale,
}) {
  return (
    <div
      id="active-filters-container"
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "auto", // allow internal horizontal scrolling only
        overflowY: "hidden",
        whiteSpace: "nowrap",
        WebkitOverflowScrolling: "touch",
        padding: "6px 8px",
        gap: 8,
        msOverflowStyle: "none",
        scrollbarWidth: "thin",
      }}
    >
      {isFavorite && (
        <div
          className="select-description"
          style={{
            marginLeft: 5,
            marginRight: 5,
            border: isFavorite ? "1px solid #ccc" : "",
            padding: 3,
            borderRadius: 5,
            marginBottom: 5,
          }}
        >
          {isFavorite ? "Favorit " : ""}

          <span
            onClick={onClearFavorite}
            style={{ marginLeft: 5, marginRight: 5, cursor: "pointer", color: "red" }}
          >
            X
          </span>
        </div>
      )}

      {onSale && (
        <div
          className="select-description"
          style={{
            marginLeft: 5,
            marginRight: 5,
            border: "1px solid #ccc",
            padding: 30,
            borderRadius: 5,
            marginBottom: 5,
          }}
        >
          {onSale ? " Zbritje" : ""}

          <span
            onClick={onClearOnSale}
            style={{ marginLeft: 5, marginRight: 5, cursor: "pointer", color: "red" }}
          >
            X
          </span>
        </div>
      )}
    </div>
  );
}
