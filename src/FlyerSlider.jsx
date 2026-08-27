import React, { useState, useEffect, useMemo, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import Button from "react-bootstrap/Button";
import { FiShare2 } from "react-icons/fi";

const FlyerSlider = ({ flyerBook, baseUrl, isFlyerModalOpen, closeFlyerModal, shareProductId }) => {

    console.log('[DEBUG] flyerBook:', flyerBook);
    console.log('[DEBUG] baseUrl:', baseUrl);
    console.log('[DEBUG] isFlyerModalOpen:', isFlyerModalOpen);

    const sliderRef = useRef(null);
    const loadTimeoutsRef = useRef({});
    const imageFrameStyle = {
      width: '400px',
      maxWidth: '100%',
      maxHeight: '80vh',
      aspectRatio: '3 / 4',
      objectFit: 'contain',
      display: 'block',
    };
    // current slide index and per-slide loaded flags
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedUrls, setLoadedUrls] = useState({});
    const [failedUrls, setFailedUrls] = useState({});
    const [shareCopied, setShareCopied] = useState(false);

    const toImageUrl = (item) => {
      const raw = String(item?.image_url || "").trim();
      if (!raw) return "";
      return raw.startsWith("http") ? raw : `${baseUrl}/${raw}`;
    };

    const visibleFlyers = useMemo(() => {
      if (!Array.isArray(flyerBook)) return [];
      return flyerBook.filter((item) => {
        const url = toImageUrl(item);
        return url && !failedUrls[url];
      });
    }, [flyerBook, failedUrls]);

    const clearLoadTimeout = (url) => {
      const timer = loadTimeoutsRef.current[url];
      if (timer) {
        clearTimeout(timer);
        delete loadTimeoutsRef.current[url];
      }
    };

    const markAsFailedAndSkip = (url) => {
      clearLoadTimeout(url);
      setLoadedUrls((prev) => ({ ...prev, [url]: true }));
      setFailedUrls((prev) => ({ ...prev, [url]: true }));
      requestAnimationFrame(() => {
        sliderRef.current?.slickNext?.();
      });
    };

    const scheduleLoadTimeout = (url) => {
      if (!url || loadedUrls[url] || failedUrls[url] || loadTimeoutsRef.current[url]) return;
      loadTimeoutsRef.current[url] = setTimeout(() => {
        markAsFailedAndSkip(url);
      }, 7000);
    };
    
    useEffect(() => {
      setLoadedUrls({});
      setFailedUrls({});
      setCurrentSlide(0);
      Object.keys(loadTimeoutsRef.current).forEach((url) => clearLoadTimeout(url));
    }, [flyerBook]);

    useEffect(() => {
      return () => {
        Object.keys(loadTimeoutsRef.current).forEach((url) => clearLoadTimeout(url));
      };
    }, []);

    // helper: map any slick index (including clones) to the original slide index
    const getRealIndex = (index) => {
      const n = visibleFlyers.length || 1;
      return ((index % n) + n) % n;
    };

    const handleShare = async () => {
      if (!shareProductId) return;
      const url = `${window.location.origin}/product/${shareProductId}`;
      try {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: 'Fletushka', url });
          return;
        }
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        }
      } catch (err) {
        console.error('Share failed:', err);
      }
    };

  // Check if flyerBook is an array and has elements
  const settings = {
    dots: true,
    infinite: visibleFlyers.length > 1,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    lazyLoad: true, // Enable lazy loading for images
    // handle cloned slides by mapping to the real index
    beforeChange: (_oldIndex, nextIndex) => setCurrentSlide(getRealIndex(nextIndex)),
    afterChange: (index) => setCurrentSlide(getRealIndex(index)),
  };

  return (
    isFlyerModalOpen && (
      <div
        onClick={closeFlyerModal}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
          >


        <button
          onClick={closeFlyerModal}
          style={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
          }}
        >
          &times;
        </button>

<div id="flamur"
  className="slider-container"
  onClick={e => e.stopPropagation()}
  style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }} // Added styles
>

  {/* slide counter */}
  {Array.isArray(visibleFlyers) && visibleFlyers.length > 0 && (
    <div style={{ color: '#fff', textAlign: 'center', marginBottom: 8, position: 'relative' }}>
      {currentSlide + 1}/{visibleFlyers.length}
      {shareProductId && (
        <button
          onClick={handleShare}
          title="Ndaj fletushkën"
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.35)',
            color: '#fff',
            borderRadius: 16,
            padding: '4px 12px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <FiShare2 size={14} /> {shareCopied ? 'U kopjua!' : 'Ndaj'}
        </button>
      )}
    </div>
  )}

  {visibleFlyers?.length > 0 ? (
    <Slider ref={sliderRef} key={visibleFlyers.length} {...settings}>
      {visibleFlyers.map((item, i) => {
        const url = toImageUrl(item);
        //console.log('[DEBUG] slide img URL:', url);

        console.log('[DEBUG] Image URL:', url);
        console.log('[DEBUG] isLoaded:', Boolean(loadedUrls[url]));

        return (
              <div id="ardita" key={url || i} style={{ textAlign: 'center' }}>
    <Zoom>

            <div style={{ position: "relative", display: "inline-block" }}>

            {!loadedUrls[url] && (
              <div
                style={{
                  ...imageFrameStyle,
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 6,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 13,
                    letterSpacing: 0.3,
                  }}
                >
                  Loading image...
                </div>
              </div>
            )}

            <img
              ref={() => scheduleLoadTimeout(url)}
              src={url}
              alt={`Flyer ${i}`}
              loading="lazy"
              style={{
                opacity: loadedUrls[url] ? 1 : 0,
                transition: 'opacity 140ms ease-out',
                ...imageFrameStyle,
                position: loadedUrls[url] ? 'static' : 'absolute',
                top: 0,
                left: 0,
              }} // Adjusted image styles for better fitting
               // add lazy loading placeholder component onload

               onLoad={() => {
                console.log('[DEBUG] Image loaded:', url);
                clearLoadTimeout(url);
                setLoadedUrls((prev) => ({ ...prev, [url]: true }));
               }  
               } // Hide placeholder on successful load
               onError={() => {
                markAsFailedAndSkip(url);
               }}
            />

      
       <Button
              style={{
                position: "absolute",
                top: "5px",
                left: "5px",
                color: "#fff",
                border: "none",
                width: 54,
                height: 54,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "30%",
                cursor: "pointer",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
              }}
            >
              <img
                src={"/click.png"}
                style={{
                  width: 46,
                  height: 46,
                  maxWidth: "none",
                }}
                alt="Zoom"
              />
            </Button>

            </div>

    </Zoom>


 

          </div>
        );
      })}
    </Slider>
  ) : (
    <p style={{ color: '#fff' }}>No valid images found for this post.</p>
  )}
</div>
      </div>
    )
  );
};

export default FlyerSlider;
