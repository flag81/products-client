import React, { useEffect, useState } from "react";
import Placeholder from "react-bootstrap/Placeholder";
import Button from "react-bootstrap/Button";

const ProductModal = ({
  isOpen,
  onClose,
  modalImageUrl,
  isImageLoaded,
  setIsImageLoaded,
  modalProduct,
  handleToggleFavorite,
  handleFlyerModal,
}) => {
  if (!isOpen) return null;

  const [computedImageStyle, setComputedImageStyle] = useState(null);
  const [modalContentStyle, setModalContentStyle] = useState(null);

  useEffect(() => {
    if (!modalImageUrl) {
      setComputedImageStyle(null);
      setModalContentStyle(null);
      return;
    }

    // Reset flags
    setIsImageLoaded(false);
    setComputedImageStyle(null);
    setModalContentStyle(null);

    const img = new Image();
    img.onload = () => {
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Available space inside overlay (leave small padding)
      const paddingX = 24; // overlay + modal padding left/right
      const paddingY = 24 + 120; // overlay + modal padding top/bottom + space for details/buttons (approx)
      const maxModalW = Math.floor(vw * 0.95) - paddingX;
      const maxModalH = Math.floor(vh * 0.9) - paddingY;

      // Compute scale to fit while preserving aspect ratio, allow natural size if it fits
      const scale = Math.min(1, maxModalW / naturalW || 1, maxModalH / naturalH || 1);
      const targetW = Math.max(32, Math.round(naturalW * scale));
      const targetH = Math.max(32, Math.round(naturalH * scale));

      // Image style: exact pixel dimensions to avoid internal scrollbars
      setComputedImageStyle({
        width: `${targetW}px`,
        height: `${targetH}px`,
        objectFit: "contain",
        display: "block",
      });

      // Modal content area constrained to viewport but sized to image
      setModalContentStyle({
        width: `${targetW + 24}px`, // include inner padding
        maxWidth: `${Math.floor(vw * 0.95)}px`,
        maxHeight: `${Math.floor(vh * 0.95)}px`,
        boxSizing: "border-box",
      });
    };
    img.onerror = () => {
      // fallback: constrain to viewport
      setComputedImageStyle({
        maxWidth: "95vw",
        maxHeight: "85vh",
        width: "auto",
        height: "auto",
        objectFit: "contain",
        display: "block",
      });
      setModalContentStyle({
        maxWidth: "95vw",
        maxHeight: "95vh",
        boxSizing: "border-box",
      });
    };
    img.src = modalImageUrl;
  }, [modalImageUrl, setIsImageLoaded]);

  return (
    <div
      id="product-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 12,
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          backgroundColor: "#fff",
          borderRadius: 8,
          // apply computed modal sizing (falls back to viewport constraints)
          ...(modalContentStyle || { maxWidth: "95vw", maxHeight: "95vh" }),
          width: modalContentStyle?.width || "auto",
          height: "auto",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
          padding: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isImageLoaded && (
          <Placeholder as="div" animation="glow" style={{ marginBottom: 8 }}>
            <Placeholder
              style={{
                width: "100%",
                height: 200,
              }}
            />
          </Placeholder>
        )}

        {/* Image area: centered, no internal scrolling; image is pre-sized to fit modal */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden", // prevent inner scrollbars
            padding: 8,
            flex: "0 0 auto",
          }}
        >
          <img
            src={modalImageUrl}
            alt="Product Modal"
            onLoad={() => setIsImageLoaded(true)}
            style={{
              borderRadius: 5,
              ...(computedImageStyle || {
                maxWidth: "95vw",
                maxHeight: "85vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                display: isImageLoaded ? "block" : "none",
              }),
            }}
          />
        </div>

        {/* Details area */}
        <div
          style={{
            flex: "0 0 auto",
            paddingTop: 8,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: "bold",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              width: "100%",
              lineHeight: 1.3,
              display: "block",
            }}
          >
            {modalProduct?.product_description}
          </span>

          <span
            style={{
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 6,
            }}
          >
            {modalProduct?.old_price && modalProduct?.old_price > 0 ? (
              <span style={{ color: "red" }}>{modalProduct.old_price}€ -</span>
            ) : null}
            <span style={{ color: "green" }}>
              <span> {modalProduct?.new_price}€</span>
              {modalProduct?.old_price > 0 &&
                modalProduct?.new_price &&
                modalProduct.old_price > modalProduct.new_price && (
                  <span>
                    {" "}
                    (-{Math.round(
                      ((modalProduct.old_price - modalProduct?.new_price) / modalProduct.old_price) *
                        100
                    )}
                    %)
                  </span>
                )}
            </span>
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {modalProduct?.logoUrl ? (
                <img src={modalProduct.logoUrl} alt="Store Logo" style={{ width: 50 }} />
              ) : (
                <span style={{ color: "black", marginRight: 5 }}>
                  {modalProduct?.storeName || "N/A"}
                </span>
              )}

              <span style={{ color: "black" }}>
                {modalProduct?.sale_end_date && new Date(modalProduct.sale_end_date) > new Date() ? (
                  <span style={{ color: "green" }}>
                    Deri:{" "}
                    {new Date(modalProduct.sale_end_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </span>
                ) : (
                  ""
                )}
              </span>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                onClick={() =>
                  handleToggleFavorite(modalProduct?.productId, modalProduct?.isFavorite)
                }
              >
                <img
                  src={modalProduct?.isFavorite ? "/star-fill-2.png" : "/star-empty.jpg"}
                  alt={modalProduct?.isFavorite ? "Unfavorite" : "Favorite"}
                  style={{
                    width: 24,
                    height: 24,
                  }}
                />
                <span className="icon-description">
                  {modalProduct?.isFavorite ? "Hiq favorit" : "Shto favorit"}
                </span>
              </div>

              {modalProduct?.flyer_book_id > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => handleFlyerModal(modalProduct.flyer_book_id)}
                >
                  <img src={"/flyer.png"} alt="Fletushka" style={{ width: 24, height: 24 }} />
                  <span className="icon-description">Fletushka</span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <img
                  src={modalProduct?.productOnSale ? "/sale-fill-2.png" : "/sale-empty.jpg"}
                  alt={modalProduct?.productOnSale ? "On sale" : "Not on sale"}
                  style={{ width: 24, height: 24 }}
                />
                <span
                  className="icon-description"
                  style={{
                    color: modalProduct?.productOnSale ? "green" : "red",
                  }}
                >
                  {modalProduct?.productOnSale ? "Aktive" : "Skaduariii"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Button
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "white",
            color: "black",
            border: "none",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "30%",
            cursor: "pointer",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: 0,
          }}
          onClick={onClose}
        >
          X
        </Button>

        <Button
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "rgba(255,255,255,0.9)",
            color: "#fff",
            border: "none",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "30%",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <img src={"/zoom.png"} style={{ width: 24, height: 24 }} alt="Zoom" />
        </Button>
      </div>
    </div>
  );
};

export default ProductModal;