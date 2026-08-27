import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { FiShare2 } from "react-icons/fi";
import { getApiBaseUrl } from "./api/apiFetch";
import { fetchFlyerByProduct } from "./api/homeApi";

// Full-page, public flyer viewer shown when a shared /product/:productId link is opened.
export default function FlyerView() {
  const { productId } = useParams();
  const [flyer, setFlyer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setFlyer(null);
    const baseUrl = getApiBaseUrl();
    fetchFlyerByProduct(baseUrl, productId)
      .then((data) => {
        if (cancelled) return;
        setFlyer(data);
        const pageList = Array.isArray(data.images) ? data.images : [];
        const idx = data.productImageUrl ? pageList.findIndex((u) => u === data.productImageUrl) : -1;
        setCurrentSlide(idx >= 0 ? idx : 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const images = useMemo(() => (Array.isArray(flyer?.images) ? flyer.images : []), [flyer]);

  // 0-based page index of the shared product's flyer page, so the flyer opens on that page.
  const startIndex = useMemo(() => {
    if (!flyer?.productImageUrl) return 0;
    const idx = images.findIndex((u) => u === flyer.productImageUrl);
    return idx >= 0 ? idx : 0;
  }, [flyer, images]);

  useEffect(() => {
    document.title = flyer?.storeName ? `${flyer.storeName} – Fletushka` : "Fletushka";
  }, [flyer]);

  const handleShare = async () => {
    const url = `${window.location.origin}/product/${productId}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Fletushka", url });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const settings = {
    dots: true,
    infinite: images.length > 1,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    initialSlide: startIndex,
    afterChange: (index) => setCurrentSlide(index),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Link
          to="/"
          style={{
            color: "#172033",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          ← Kthehu
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {flyer?.storeLogoUrl ? (
            <img
              src={flyer.storeLogoUrl}
              alt={flyer.storeName || "Dyqani"}
              style={{ width: 28, height: 28, objectFit: "contain", display: "block", flexShrink: 0 }}
            />
          ) : null}
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#172033",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {flyer?.storeName || "Fletushka"}
          </span>
        </div>

        <button
          onClick={handleShare}
          title="Ndaj fletushkën"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#2563eb",
            border: "none",
            color: "#fff",
            borderRadius: 18,
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <FiShare2 size={15} /> {shareCopied ? "U kopjua!" : "Ndaj"}
        </button>
      </header>

      <main style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {isLoading && <p style={{ color: "#172033" }}>Duke u ngarkuar…</p>}

        {!isLoading && error && (
          <div style={{ textAlign: "center", color: "#172033" }}>
            <p style={{ fontSize: 16 }}>Nuk u gjet fletushka për këtë produkt.</p>
            <Link to="/" style={{ color: "#2563eb" }}>
              Kthehu te faqja kryesore
            </Link>
          </div>
        )}

        {!isLoading && !error && flyer && images.length === 0 && (
          <p style={{ color: "#172033" }}>Nuk ka imazhe për këtë fletushkë.</p>
        )}

        {images.length > 0 && (
          <div style={{ width: "100%", maxWidth: 480 }}>
            <div style={{ textAlign: "center", color: "#172033", marginBottom: 8, fontWeight: 600 }}>
              {currentSlide + 1}/{images.length}
            </div>
            <Slider {...settings}>
              {images.map((url, i) => (
                <div key={url || i} style={{ textAlign: "center" }}>
                  <Zoom>
                    <img
                      src={url}
                      alt={`Fletushka ${i + 1}`}
                      loading="lazy"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        maxHeight: "80vh",
                        aspectRatio: "3 / 4",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto",
                        borderRadius: 8,
                        background: "#ffffff",
                      }}
                    />
                  </Zoom>
                </div>
              ))}
            </Slider>
          </div>
        )}
      </main>
    </div>
  );
}