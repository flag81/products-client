import React, { useEffect, useRef, useState } from "react";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import { getDisplayDiscountPercentage } from "../utils/pricing";
import { buildProductImageUrl } from "../utils/cloudinary";
import { getApiBaseUrl } from "../api/apiFetch";
import ProductImageOverlays from "./ProductImageOverlays";
import FavoriteToggle from "./FavoriteToggle";
import StoreBadge from "./StoreBadge";
import { FiShare2 } from "react-icons/fi";

export default function ProductCard({
  variant,
  product,
  baseUrl,
  autoTransformation,
  directory,
  setIsCardImageLoaded,
  onOpenModal,
  onToggleFavorite,
  onOpenShare,
  onOpenFlyer,
  compact = false,
}) {
  const imageMetaRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const hasReportedBrokenRef = useRef(false);
  const nodeUrl = getApiBaseUrl();

  const openFromCard = (imageUrl, productToOpen) => {
    onOpenModal(imageUrl, productToOpen, imageMetaRef.current);
  };

  const imgUrl = buildProductImageUrl({
    imageUrl: product?.image_url,
    baseUrl,
    autoTransformation,
    directory,
  });

  const reportBrokenImage = (reason, failingUrl = "") => {
    if (hasReportedBrokenRef.current || !nodeUrl) return;
    hasReportedBrokenRef.current = true;

    fetch(`${nodeUrl}/report-broken-product-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product?.productId || null,
        storeId: product?.storeId || null,
        storeName: product?.storeName || null,
        rawProductImageUrl: product?.image_url || "",
        attemptedCloudinaryUrl: imgUrl || "",
        failingUrl: failingUrl || imgUrl || product?.image_url || "",
        facebookPostId: product?.postId || null,
        facebookImageId: product?.imageId || null,
        facebookTimestamp: product?.timestamp || null,
        clientError: reason,
        sourcePage: "home-product-card",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      }),
    }).catch(() => {});
  };

  useEffect(() => {
    if (!imgUrl && !hasReportedBrokenRef.current && nodeUrl) {
      hasReportedBrokenRef.current = true;
      fetch(`${nodeUrl}/report-broken-product-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?.productId || null,
          storeId: product?.storeId || null,
          storeName: product?.storeName || null,
          rawProductImageUrl: product?.image_url || "",
          attemptedCloudinaryUrl: "",
          failingUrl: product?.image_url || "",
          facebookPostId: product?.postId || null,
          facebookImageId: product?.imageId || null,
          facebookTimestamp: product?.timestamp || null,
          clientError: "missing-image-url",
          sourcePage: "home-product-card",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      }).catch(() => {});
    }
  }, [imgUrl, nodeUrl, product]);

  if (!imgUrl || imageLoadFailed) return null;

  // In compact (2-per-row mobile) layout everything scales down (0.78 = 0.5 + 30% + 20%).
  const compactScale = compact ? 0.78 : 1;
  const bottomIconSize = Math.round(30 * compactScale);
  const priceOldSize = `${Math.round(15 * compactScale)}px`;
  const priceNewSize = `${Math.round(20 * compactScale)}px`;
  const menuSize = Math.round(34 * compactScale);
  const miniIconSize = Math.round(24 * compactScale);
  const commonCardClass = `h-100 pt-1 px-1 pb-0 product-card d-flex flex-column${compact ? " product-card-compact" : ""}`;

  if (variant === "onsale") {
    return (
      <Col className="d-flex mb-3 mb-sm-0" style={{ minWidth: 0 }}>
        <Card
          className={commonCardClass}
          style={{
            width: "100%",
            borderColor: null,
            border: "0px solid #060101ff",
            marginBottom: 30,
          }}
        >
          <div className="product-card-image" style={{ position: "relative", width: "100%", height: "auto" }}>
            {!imageLoaded && (
              <div className="product-image-skeleton" aria-hidden="true" />
            )}

            <Zoom>
              <img
                className="card-img-top product-image"
                src={imgUrl}
                alt={product.product_description}
                loading="lazy"
                onLoad={(e) => {
                  imageMetaRef.current = {
                    width: e.currentTarget?.naturalWidth,
                    height: e.currentTarget?.naturalHeight,
                  };
                  setImageLoaded(true);
                  setIsCardImageLoaded(true);
                }}
                onError={() => {
                  reportBrokenImage("image-load-error", imgUrl);
                  setImageLoadFailed(true);
                }}
                style={{
                  display: "block",
                  cursor: "pointer",
                  width: "100%",
                  height: "auto",
                  opacity: imageLoaded ? 1 : 0,
                  transition: "opacity 200ms ease-out",
                }}
              />
            </Zoom>

            {imageLoaded && (
              <ProductImageOverlays
                imgUrl={imgUrl}
                product={product}
                onOpenModal={openFromCard}
                discountPct={getDisplayDiscountPercentage(product)}
                compact={compact}
              />
            )}
          </div>

          <Card.Body
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              paddingBottom: 2,
              paddingTop: 0,
            }}
          >
            <Card.Text className="product-description" style={{ textAlign: "center" }}>
              <b>{product.product_description.toUpperCase()}</b>
            </Card.Text>

            <Card.Text
              className="product-description"
              style={{
                border: "1px solid #ccc",
                borderRadius: 9,
                backgroundColor: "#f9f5f5",
                textAlign: "center",
              }}
            >
              <span style={{ color: "red", fontWeight: "bold", fontSize: priceOldSize }}>
                {product.old_price && product.old_price > 0
                  ? product.old_price + "€  - "
                  : ""}
              </span>
              <span
                style={{ color: "green", fontWeight: "bold", fontSize: priceNewSize }}
                className="bold-text"
              >
                {product.new_price > 0 ? `${product.new_price}€` : ""}
              </span>

              <span
                style={{ color: "green", fontWeight: "bold", fontSize: priceNewSize }}
                className="bold-text"
              >
                {(() => {
                  const pct = getDisplayDiscountPercentage(product);
                  return pct > 0 ? ` (-${pct}%)` : "";
                })()}
              </span>
            </Card.Text>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <div
                id="bottom-menu"
                style={{
                  display: "flex",
                  width: "100%",
                  flexDirection: "row",
                  alignItems: "flex-end",
                  paddingBottom: 0,
                  paddingTop: 0,
                  justifyContent: "space-between",
                  borderRadius: 0,
                  minHeight: menuSize,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-end", height: menuSize }}>
                  <FavoriteToggle
                    isFavorite={product.isFavorite}
                    onClick={() => onToggleFavorite(product.productId, product.isFavorite)}
                    size={bottomIconSize}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", height: menuSize }}>
                  <StoreBadge
                    logoUrl={product.logoUrl}
                    storeName={product.storeName}
                    size={bottomIconSize}
                  />
                </div>

                {product?.flyer_book_id > 0 && (
                  <div
                    role="button"
                    title="Fletushka"
                    onClick={() => onOpenFlyer && onOpenFlyer(product.flyer_book_id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      height: menuSize,
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src="/flyer.png"
                      alt="Fletushka"
                      style={{
                        width: bottomIconSize,
                        height: bottomIconSize,
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </div>
                )}

                <div
                  role="button"
                  title="Ndaj produktin"
                  onClick={() => onOpenShare && onOpenShare(product)}
                  style={{ display: "flex", alignItems: "flex-end", height: menuSize, cursor: "pointer" }}
                >
                  <FiShare2
                    aria-label="Ndaj produktin"
                    style={{
                      width: bottomIconSize,
                      height: bottomIconSize,
                      color: "#0f172a",
                    }}
                  />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  }

  // default: not-onsale
  const pct = getDisplayDiscountPercentage(product);

  return (
    <Col className="d-flex" style={{ minWidth: 0 }}>
      <Card
        className={commonCardClass}
        style={{
          width: "100%",
          paddingBottom: 0,
          borderColor: product.productOnSale ? "green" : null,
        }}
      >
        <div className="product-card-image" style={{ position: "relative", width: "100%", height: "auto" }}>
          {!imageLoaded && (
            <div className="product-image-skeleton" aria-hidden="true" />
          )}

          <Zoom>
            <img
              className="card-img-top product-image"
              src={imgUrl}
              alt={product.product_description}
              loading="lazy"
              onLoad={(e) => {
                imageMetaRef.current = {
                  width: e.currentTarget?.naturalWidth,
                  height: e.currentTarget?.naturalHeight,
                };
                setImageLoaded(true);
                setIsCardImageLoaded(true);
              }}
              onError={() => {
                reportBrokenImage("image-load-error", imgUrl);
                setImageLoadFailed(true);
              }}
              style={{
                display: "block",
                cursor: "pointer",
                width: "100%",
                height: "auto",
                filter: "grayscale(100%)",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 200ms ease-out",
              }}
            />
          </Zoom>

          {imageLoaded && (
            <ProductImageOverlays
              imgUrl={imgUrl}
              product={product}
              onOpenModal={openFromCard}
              discountPct={pct}
              compact={compact}
            />
          )}
        </div>

        <Card.Body
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <Card.Text className="product-description" style={{ textAlign: "center" }}>
            {product.product_description}
          </Card.Text>

          <Card.Text className="product-description" style={{ textAlign: "center" }}>
            <span style={{ color: "red" }}>
              {product.old_price && product.old_price > 0 ? product.old_price + "€ - " : ""}
            </span>
            <span style={{ color: "green" }}>
              {product.old_price > product.new_price
                ? product.new_price + "€ "
                : product.new_price + "€*"}
            </span>
          </Card.Text>

          <Card.Text className="product-description bold-text" style={{ textAlign: "center" }}>
            {product.storeName}
          </Card.Text>
          <Card.Text className="sale-date" style={{ textAlign: "center" }}>
            {product.sale_end_date ? (
              <>
                <span style={{ color: product.productOnSale ? "green" : "red" }}>
                  {product.productOnSale ? "Deri" : "Skaduar"} :
                  {new Date(product.sale_end_date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                  <br />
                </span>
              </>
            ) : null}
          </Card.Text>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <div
              id="bottom-menu"
              style={{
                display: "flex",
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                paddingBottom: 0,
                paddingTop: 0,
                justifyContent: "space-between",
                borderRadius: 5,
              }}
            >
              <FavoriteToggle
                isFavorite={product.isFavorite}
                onClick={() => onToggleFavorite(product.productId, product.isFavorite)}
                size={miniIconSize}
              />

              {product?.flyer_book_id > 0 && (
                <div
                  role="button"
                  title="Fletushka"
                  onClick={() => onOpenFlyer && onOpenFlyer(product.flyer_book_id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src="/flyer.png"
                    alt="Fletushka"
                    style={{
                      width: miniIconSize,
                      height: miniIconSize,
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              )}

              <div
                role="button"
                title="Ndaj produktin"
                onClick={() => onOpenShare && onOpenShare(product)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <FiShare2
                  aria-label="Ndaj produktin"
                  style={{
                    width: miniIconSize,
                    height: miniIconSize,
                    color: "#0f172a",
                  }}
                />
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}
