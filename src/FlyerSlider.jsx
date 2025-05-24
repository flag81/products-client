import React, { lazy } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Placeholder } from "react-bootstrap";

// Styles for container (add to your CSS file or styled-component)
// .slider-container {
//   width: 600px;
//   margin: 0 auto;
// }

const FlyerSlider = ({ flyerBook, baseUrl, isFlyerModalOpen, closeFlyerModal }) => {

    console.log('[DEBUG] flyerBook:', flyerBook);
    console.log('[DEBUG] baseUrl:', baseUrl);
    console.log('[DEBUG] isFlyerModalOpen:', isFlyerModalOpen);

    // Check if flyerBook is an array and has elements
  const settings = {
    dots: true,
    infinite: true,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    

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
            top: '20px',
            right: '20px',
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
  style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }} // Added styles
>
  {flyerBook.length > 0 ? (
    <Slider key={flyerBook.length} {...settings}>
      {flyerBook.map((item, i) => {
        const url = item.image_url.startsWith('http')
          ? item.image_url
          : `<span class="math-inline">\{baseUrl\}/</span>{item.image_url}`;
        //console.log('[DEBUG] slide img URL:', url);
        return (
          <div id="ardita" key={i} style={{ textAlign: 'center' }}>
            <img
              src={url}
              alt={`Flyer ${i}`}
              style={{ display: 'inline-block', width: '100%', maxHeight: '80vh', objectFit: 'contain' }} // Adjusted image styles for better fitting
            />
          </div>
        );
      })}
    </Slider>
  ) : (
    <p style={{ color: '#fff' }}>Loading images…</p>
  )}
</div>
      </div>
    )
  );
};

export default FlyerSlider;
