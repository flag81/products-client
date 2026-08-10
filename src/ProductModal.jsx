import React, { useEffect, useState, useRef } from "react";
import Placeholder from "react-bootstrap/Placeholder";
import Button from "react-bootstrap/Button";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { getDisplayDiscountPercentage } from "./utils/pricing";

const ProductModal = ({
  isOpen,
  onClose,
  modalImageUrl,
  modalImageFrame,
  isImageLoaded,
  setIsImageLoaded,
  modalProduct,
  handleToggleFavorite,
  handleFlyerModal,
  resetZoomKey, // <- new prop
}) => {
  if (!isOpen) return null;

  const [computedImageStyle, setComputedImageStyle] = useState(null);
  const [modalContentStyle, setModalContentStyle] = useState(null);

  // react-zoom-pan-pinch control reference
  const transformMethodsRef = useRef(null);

  // small local flag so the UI can show zoom state (true when scale > 1)
  const [zoomEnabled, setZoomEnabled] = useState(false);

  // Reset transform: use library method to clear zoom & pan
  const resetZoom = () => {
    if (transformMethodsRef.current?.resetTransform) {
      transformMethodsRef.current.resetTransform();
    }
  };

  // toggle zoom on button / double click
  const toggleZoom = () => {
    const m = transformMethodsRef.current;
    if (!m) return;
    const currentScale = m.state?.scale ?? 1;
    if (currentScale > 1) {
      m.resetTransform();
    } else {
      m.zoomIn && m.zoomIn(); // zoomIn to next step
    }
  };

  // Reset zoom when Home screen (or window) comes into focus and incremented key arrives
  useEffect(() => {
    if (!isOpen) return;
    if (typeof resetZoomKey !== "undefined") {
      resetZoom();
    }
  }, [resetZoomKey, isOpen]);

  // also reset when modal is opened (focus)
  useEffect(() => {
    if (isOpen) resetZoom();
  }, [isOpen]);

  useEffect(() => {
    if (!modalImageUrl) {
      setComputedImageStyle(null);
      setModalContentStyle(null);
      return;
    }

    // If Home provided exact dimensions from the clicked card image,
    // use them immediately to keep placeholder and image the same size.
    const frameW = Number(modalImageFrame?.width);
    const frameH = Number(modalImageFrame?.height);
    if (frameW > 0 && frameH > 0) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const paddingX = 24;
      const paddingY = 24 + 120;
      const maxModalW = Math.max(32, Math.floor(vw * 0.95) - paddingX);
      const maxModalH = Math.max(32, Math.floor(vh * 0.75) - paddingY);
      const scale = Math.min(1, maxModalW / frameW || 1, maxModalH / frameH || 1);
      const targetW = Math.max(32, Math.round(frameW * scale));
      const targetH = Math.max(32, Math.round(frameH * scale));

      setIsImageLoaded(false);
      setComputedImageStyle({
        width: `${targetW}px`,
        height: `${targetH}px`,
        objectFit: "contain",
        display: "block",
      });
      setModalContentStyle({
        width: `${targetW + 24}px`,
        maxWidth: "95vw",
        maxHeight: "95vh",
        boxSizing: "border-box",
      });
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
      const maxModalW = Math.max(32, Math.floor(vw * 0.95) - paddingX);
      const maxModalH = Math.max(32, Math.floor(vh * 0.75) - paddingY);

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
  }, [modalImageUrl, modalImageFrame, setIsImageLoaded]);

  // Ensure modal close resets zoom (use wrapper reset if available)
  const handleClose = () => {
    if (transformMethodsRef.current?.resetTransform) transformMethodsRef.current.resetTransform();
    onClose();
  };

  // Reset transform when external reset key changes
  useEffect(() => {
    if (typeof resetZoomKey !== "undefined" && transformMethodsRef.current?.resetTransform) {
      transformMethodsRef.current.resetTransform();
    }
  }, [resetZoomKey]);

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
      onClick={handleClose}
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
          padding: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isImageLoaded && (
          <Placeholder as="div" animation="glow" style={{ marginBottom: 8 }}>
            <Placeholder
              style={{
                width: "100%",
                height: computedImageStyle?.height || 320, // was 200
              }}
            />
          </Placeholder>
        )}

        {/* Image area: use react-zoom-pan-pinch for pinch/pan/zoom */}
        <div style={{ padding: 8, flex: "0 0 auto", width: "100%" }}>
          <TransformWrapper
            options={{ limitToBounds: true, minScale: 1, maxScale: 4 }}
            wheel={{ step: 0.2 }}
            doubleClick={{ mode: "zoomIn", step: 1.5 }}
            pinch={{ step: 5 }}
            onInit={(methods) => {
              transformMethodsRef.current = methods;
              setZoomEnabled((methods.state?.scale ?? 1) > 1);
            }}
            onZoomStop={(ref) => {
              setZoomEnabled((ref.state?.scale ?? 1) > 1);
            }}
          >
            {(methods) => {
              transformMethodsRef.current = methods;
              return (
                <TransformComponent>
                  <img
                    src={modalImageUrl}
                    alt="Product Modal"
                    onLoad={() => setIsImageLoaded(true)}
                    style={{
                      display: isImageLoaded ? "block" : "none",
                      width: computedImageStyle?.width || "95vw",
                      height: computedImageStyle?.height || "55vw",
                      objectFit: "contain",
                      borderRadius: 5,
                      margin: "0 auto",
                      willChange: "transform",
                    }}
                  />
                </TransformComponent>
              );
            }}
          </TransformWrapper>
        </div>

        {/* Details area */}
        <div
          style={{
            flex: "0 0 auto",
            paddingTop: 8,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <span
            className="product-description"
            style={{
              fontSize: 16,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              width: "100%",
              lineHeight: 1.3,
              display: "block",
              textAlign: "center",
            }}
          >
            <b>{String(modalProduct?.product_description || "").toUpperCase()}</b>
          </span>

          <div
            className="product-description"
            style={{
              border: "1px solid #ccc",
              borderRadius: 9,
              backgroundColor: "#f9f5f5",
              marginTop: 6,
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
              width: "100%",
              maxWidth: 420,
            }}
          >
            <span style={{ color: "red", fontWeight: "bold", fontSize: "15px" }}>
              {modalProduct?.old_price && modalProduct?.old_price > 0
                ? `${modalProduct.old_price}€  - `
                : ""}
            </span>

            <span style={{ color: "green", fontWeight: "bold", fontSize: "20px" }}>
              {modalProduct?.new_price > 0 ? `${modalProduct.new_price}€` : ""}
            </span>

            <span style={{ color: "green", fontWeight: "bold", fontSize: "20px" }}>
              {(() => {
                const pct = getDisplayDiscountPercentage(modalProduct);
                return pct > 0 ? ` (-${pct}%)` : "";
              })()}
            </span>
          </div>

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
                marginLeft: 4,
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



                  
                  <span style={{ color: "green", display: "flex", alignItems: "center", gap: 4 }}>
                   
                    <img
                      src={"/expire2.png"}
                      alt="Expires"
                      style={{
                        width: 30,
                        height: 30,
                        objectFit: "contain"
                      }}
                    />

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
                    marginRight: 5,
                  }}
                  onClick={() => handleFlyerModal(modalProduct.flyer_book_id)}
                >
                  <img src={"/flyer.png"} alt="Fletushka" style={{ width: 24, height: 24 }} />
                  <span className="icon-description">Fletushka</span>
                </div>
              )}


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
          onClick={handleClose}
        >
          X
        </Button>

        <Button
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            color: zoomEnabled ? "#fff" : "#000",
            border: "none",
            width: 67,
            height: 67,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "30%",
            cursor: "pointer",
            padding: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleZoom();
          }}
        >
          <img
            src={zoomEnabled ? "/zoom.png" : "/zoom.png"}
            style={{ width: 58, height: 58, maxWidth: "none" }}
            alt="Zoom"
          />
        </Button>
      </div>
    </div>
  );
};

export default ProductModal;