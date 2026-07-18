import React, { useEffect, useRef, useState } from "react";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Placeholder from "react-bootstrap/Placeholder";

import { getDisplayDiscountPercentage } from "../utils/pricing";
import { buildProductImageUrl } from "../utils/cloudinary";
import { getApiBaseUrl } from "../api/apiFetch";
import ProductImageOverlays from "./ProductImageOverlays";
import FavoriteToggle from "./FavoriteToggle";
import StoreBadge from "./StoreBadge";
import ExpiryBadge from "./ExpiryBadge";

export default function ProductCard({
  variant,
  product,
  baseUrl,
  autoTransformation,
  directory,
  isCardImageLoaded,
  setIsCardImageLoaded,
  onOpenModal,
  onToggleFavorite,
}) {
  const imageMetaRef = useRef(null);
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

  const commonCardClass = "h-100 pt-1 px-1 pb-0 product-card d-flex flex-column";
  const bottomIconSize = 30;

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
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {!isCardImageLoaded && (
              <Placeholder as="div" animation="glow">
                <Placeholder
                  style={{ width: "100%", height: "200px" }}
                  className="rounded"
                />
              </Placeholder>
            )}

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
                setIsCardImageLoaded(true);
              }}
              onError={() => {
                reportBrokenImage("image-load-error", imgUrl);
                setImageLoadFailed(true);
              }}
              onClick={() => openFromCard(imgUrl, product)}
              style={{
                display: "block",
                cursor: "pointer",
                width: "100%",
                height: "auto",
              }}
            />

            <ProductImageOverlays
              imgUrl={imgUrl}
              product={product}
              onOpenModal={openFromCard}
              discountPct={0}
            />
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
              <span style={{ color: "red", fontWeight: "bold", fontSize: "15px" }}>
                {product.old_price && product.old_price > 0
                  ? product.old_price + "€  - "
                  : ""}
              </span>
              <span
                style={{ color: "green", fontWeight: "bold", fontSize: "20px" }}
                className="bold-text"
              >
                {product.new_price > 0 ? `${product.new_price}€` : ""}
              </span>

              <span
                style={{ color: "green", fontWeight: "bold", fontSize: "20px" }}
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
                  minHeight: 34,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-end", height: 34 }}>
                  <FavoriteToggle
                    isFavorite={product.isFavorite}
                    onClick={() => onToggleFavorite(product.productId, product.isFavorite)}
                    size={bottomIconSize}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", height: 34 }}>
                  <StoreBadge
                    logoUrl={product.logoUrl}
                    storeName={product.storeName}
                    size={bottomIconSize}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", height: 34 }} role="button">
                  <ExpiryBadge
                    saleEndDate={product.sale_end_date}
                    productOnSale={product.productOnSale}
                    iconSize={bottomIconSize}
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
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {!isCardImageLoaded && (
            <Placeholder as="div" animation="glow">
              <Placeholder
                style={{ width: "100%", height: "200px" }}
                className="rounded"
              />
            </Placeholder>
          )}

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
              setIsCardImageLoaded(true);
            }}
            onError={() => {
              reportBrokenImage("image-load-error", imgUrl);
              setImageLoadFailed(true);
            }}
            onClick={() => openFromCard(imgUrl, product)}
            style={{
              display: "block",
              cursor: "pointer",
              width: "100%",
              height: "auto",
              filter: "grayscale(100%)",
            }}
          />

          <ProductImageOverlays
            imgUrl={imgUrl}
            product={product}
            onOpenModal={openFromCard}
            discountPct={pct}
          />
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
              />
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}
