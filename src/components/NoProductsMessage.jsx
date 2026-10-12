import React from "react";
import PropTypes from "prop-types";

export default function NoProductsMessage({ show, keyword, children }) {
  if (!show) return null;

  const trimmedKeyword = String(keyword || "").trim();

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
      Nuk u gjenden produkte{trimmedKeyword ? ` për "${trimmedKeyword}"` : ""}.
      {children}
    </div>
  );
}

NoProductsMessage.propTypes = {
  show: PropTypes.bool,
  keyword: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node,
};
