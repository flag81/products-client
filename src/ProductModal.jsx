import React from "react";
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          backgroundColor: "#fff",
          borderRadius: 8,
          maxWidth: 400,
          width: "98vw",
          maxHeight: "100vh",
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isImageLoaded && (
          <Placeholder as="div" animation="glow">
            <Placeholder
              style={{
                width: 300,
                maxWidth: 300,
                height: "60vh",
              }}
            />
          </Placeholder>
        )}

        <img
          src={modalImageUrl}
          alt="Product Modal"
          onLoad={() => setIsImageLoaded(true)}
          style={{
            display: isImageLoaded ? "block" : "none",
            width: "100%",
            maxHeight: "40vh",
            maxWidth: 470,
            maxHeight: "100vh",
            cursor: "zoom-in",
            borderRadius: 5,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />

        <span
          style={{
            fontSize: 16,
            fontWeight: "bold",
            marginTop: 10,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            width: "100%",
            lineHeight: 1.3,
          }}
        >
          {modalProduct.product_description}
        </span>

        <span style={{ 
            
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",

            
            }}>
          {modalProduct.old_price && modalProduct.old_price > 0 ? (
            <span style={{ color: "red" }}>
              {modalProduct.old_price}€ -
            </span>
          ) : null}
          <span style={{ color: "greenii" }}>
            <span> {modalProduct?.new_price}€</span>
            {modalProduct.old_price > 0 && modalProduct?.new_price && modalProduct.old_price > modalProduct.new_price && (
              <span>
                {" "}
                (-{Math.round(
                  ((modalProduct.old_price - modalProduct?.new_price) /
                    modalProduct.old_price) *
                    100
                )}
                %)
              </span>
            )}
          </span>
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 5,
          }}
        >

          {modalProduct.logoUrl ? (
            <img src={modalProduct.logoUrl} alt="Store Logo" style={{ width: 50}} />
          ) : (
            <span style={{ color: "black", marginRight: 5 }}>
              {modalProduct.storeName || 'N/A'}
            </span>
          )}




          <span style={{ color: "black" }}>
            {modalProduct.sale_end_date &&
            new Date(modalProduct.sale_end_date) > new Date() ? (
              <span style={{ color: "green" }}>
                Deri:{" "}
                {new Date(
                  modalProduct.sale_end_date
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </span>
            ) : (
              ""
            )}
          </span>
        </span>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
            padding: 5,
            borderRadius: 5,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={() =>
              handleToggleFavorite(
                modalProduct.productId,
                modalProduct.isFavorite
              )
            }
          >
            <img
              src={
                modalProduct.isFavorite
                  ? "/star-fill-2.png"
                  : "/star-empty.jpg"
              }
              alt={modalProduct.isFavorite ? "Unfavorite" : "Favorite"}
              style={{
                width: 24,
                height: 24,
              }}
            />
            <span className="icon-description">
              {modalProduct.isFavorite ? "Hiq favorit" : "Shto favorit"}
            </span>
          </div>

          {modalProduct.flyer_book_id > 0 && (
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
              <img
                src={"/flyer.png"}
                alt="Fletushka"
                style={{
                  width: 24,
                  height: 24,
                }}
              />
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
              src={
                modalProduct.productOnSale
                  ? "/sale-fill-2.png"
                  : "/sale-empty.jpg"
              }
              alt={
                modalProduct.productOnSale ? "On sale" : "Not on sale"
              }
              style={{ width: 24, height: 24 }}
            />
            <span
              className="icon-description"
              style={{
                color: modalProduct.productOnSale ? "green" : "red",
              }}
            >
              {modalProduct.productOnSale ? "Aktive" : "Skaduariii"}
            </span>
          </div>
        </div>

        <Button
          style={{
            position: "absolute",
            top: 5,
            right: 5,
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
            //transparency: 0.5,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
          }}
          onClick={onClose}
        >
          X
        </Button>

        <Button
          style={{
            position: "absolute",
            top: "5px",
            left: "5px",
            backgroundColor: "white",
            color: "#fff",
            border: "none",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "30%",
            cursor: "pointer",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <img
            src={"/zoom.png"}
            style={{
              width: 24,
              height: 24,
            }}
            alt="Zoom"
          />
        </Button>
      </div>
    </div>
  );
};

export default ProductModal;