import React from "react";

export default function ExpiryBadge({ saleEndDate, productOnSale }) {
  if (!saleEndDate) return null;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          verticalAlign: "middle",
        }}
      >
        <img
          src={"/expire2.png"}
          alt="Expires"
          style={{
            width: 30,
            height: 30,
            objectFit: "contain",
          }}
        />
        <span
          style={{ color: productOnSale ? "green" : "red" }}
          className="bold-text"
        >
          {new Date(saleEndDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}
        </span>
      </div>
      <br />
    </>
  );
}
