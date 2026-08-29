import React from "react";

export default function ProductImageOverlays({ imgUrl, product, onOpenModal, discountPct }) {
  return (
    <>
      <div
        className="overlay-container"
        role="button"
        style={{
          position: "absolute",
          top: "5px",
          left: "5px",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          padding: "15px",
          borderRadius: "20%",
        }}
      >
        <img
          src={"/loop.png"}
          alt="Overlay"
          style={{ position: "absolute", top: "0px", right: "0px" }}
          onClick={() => onOpenModal(imgUrl, product)}
        />
      </div>

      <div
        className="overlay-container2"
        style={{
          position: "absolute",
          top: "5px",
          left: "5px",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          padding: "5px",
          borderRadius: "20%",
        }}
      >
        <img
          src={"/click.png"}
          alt="Overlay"
          style={{
            width: 46,
            maxWidth: "none",
          }}
          onClick={() => onOpenModal(imgUrl, product)}
        />
      </div>

      <div
        className="overlay-container3"
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderRadius: "20%",
        }}
      >
        {discountPct > 0 ? (
          <span style={{ color: "green", fontWeight: "bold" }}>-{discountPct}%</span>
        ) : null}
      </div>

      <div
        className="overlay-container4"
        style={{
          position: "absolute",
          bottom: "5px",
          right: "5px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "6px 10px",
          borderRadius: "20%",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {product?.sale_end_date ? (
          <>
            <img
              src="/expire2.png"
              alt="Expires"
              style={{
                width: 18,
                height: 18,
                objectFit: "contain",
                display: "block",
              }}
            />
            <span
              style={{
                color: product.productOnSale ? "green" : "red",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              {new Date(product.sale_end_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })}
            </span>
          </>
        ) : null}
      </div>
    </>
  );
}
