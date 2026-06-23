import React from "react";

export default function FavoriteToggle({ isFavorite, onClick, size = 24 }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderColor: "red",
      }}
      role="button"
    >
      <img
        src={isFavorite ? "star-fill-2.png" : "star-empty.jpg"}
        alt={isFavorite ? "Unfavorite" : "Favorite"}
        style={{ width: size, height: size }}
        onClick={onClick}
      />
    </div>
  );
}
