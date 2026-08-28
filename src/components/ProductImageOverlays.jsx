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
    </>
  );
}
