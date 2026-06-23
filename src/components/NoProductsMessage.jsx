import React from "react";

export default function NoProductsMessage({ show }) {
  if (!show) return null;

  return (
    <div
      id="no-products-message"
      style={{
        borderRadius: 5,
        border: "1px solid #a33535",
        margin: "10px auto", // Center the div horizontally
        padding: "10px",
        width: "90%", // Set width to 90% of the parent container
        textAlign: "center", // Center the text inside
        background: "#d7d8db",
      }}
    >
      Nuk u gjenden produkte.
    </div>
  );
}
