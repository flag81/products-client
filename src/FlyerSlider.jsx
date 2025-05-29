import React, { lazy, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Placeholder } from "react-bootstrap";

import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import Button from "react-bootstrap/Button";

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
    lazyLoad: true, // Enable lazy loading for images
 
    
    

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


  {flyerBook?.length > 0 ? (
    <Slider key={flyerBook?.length} {...settings}>
      {flyerBook.map((item, i) => {
        const [isLoading, setIsLoading] = useState(true);
        const url = item.image_url.startsWith('http')
          ? item.image_url
          : `<span class="math-inline">\{baseUrl\}/</span>{item.image_url}`;
        //console.log('[DEBUG] slide img URL:', url);

        console.log('[DEBUG] Image URL:', url);
        console.log('[DEBUG] isLoading:', isLoading);

        return (
          <div id="ardita" key={i} style={{ textAlign: 'center' }}>
            {isLoading && (
    <>
        {console.log('[DEBUG] Rendering PlaceholderImage')}
        <Placeholder as="div" animation="glow">
                <Placeholder
                  style={{
                    width: "100%",
                    height: "400px", // Adjust to match the image dimensions
                    backgroundColor: 'lightgray'
                  }}
                  className="rounded" // Optional: Add rounded corners
                />
              </Placeholder>
    </>
)}

    <Zoom>

            <div style={{ position: "relative", display: "inline-block" }}>

            <img
              src={url}
              alt={`Flyer ${i}`}
              style={{ display: isLoading ? 'none' : 'inline-block',
                width: '400px', 
                maxHeight: '80vh', 
                objectFit: 'contain' }} // Adjusted image styles for better fitting
               // add lazy loading placeholder component onload

               onLoad={() => {

                console.log('[DEBUG] Image loaded:', url);
                setIsLoading(false)

               } 


               } // Hide placeholder on successful load
               onError={() => setIsLoading(false)} // Hide placeholder on error
            />

      
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
                src={"/click.png"}
                style={{
                  width: 24,
                  height: 24,
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
    <p style={{ color: '#fff' }}>Duke ngarkuar…</p>
  )}
</div>
      </div>
    )
  );
};

export default FlyerSlider;
