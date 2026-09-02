import React from "react";

export default function ProductImageOverlays({ imgUrl, product, onOpenModal, discountPct, compact = false }) {
  // Compact (2-per-row mobile) layout: scale every size down (0.78 = 0.65 + extra 20%).
  const s = compact ? 0.78 : 1;
  const px = (n) => `${Math.round(n * s)}px`;
  const iconClick = Math.round(46 * s);
  const iconExpire = Math.round(18 * s);
  const iconPin = Math.round(14 * s);

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
          padding: px(5),
          borderRadius: "20%",
        }}
      >
        <img
          src={"/click.png"}
          alt="Overlay"
          style={{
            width: iconClick,
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
          <span
            style={{
              color: "green",
              fontWeight: "bold",
              fontSize: compact ? "16px" : undefined,
            }}
          >
            -{discountPct}%
          </span>
        ) : null}
      </div>

      <div
        className="overlay-container4"
        style={{
          position: "absolute",
          bottom: "5px",
          right: "5px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: `${px(6)} ${px(10)}`,
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
                width: iconExpire,
                height: iconExpire,
                objectFit: "contain",
                display: "block",
              }}
            />
            <span
              style={{
                color: product.productOnSale ? "green" : "red",
                fontWeight: "bold",
                fontSize: px(14),
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

      {product?.city ? (
        <div
          className="overlay-container-city"
          title={product.city}
          style={{
            position: "absolute",
            bottom: "5px",
            left: "5px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: `${px(6)} ${px(10)}`,
            borderRadius: "20%",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            maxWidth: "70%",
          }}
        >
          <svg
            width={iconPin}
            height={iconPin}
            viewBox="0 0 24 24"
            fill="#dc2626"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          <span
            style={{
              color: "#0f172a",
              fontWeight: "bold",
              fontSize: px(13),
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {product.city}
          </span>
        </div>
      ) : null}
    </>
  );
}
