import React from "react";

import FlyerSlider from "../FlyerSlider";
import ProductModal from "../ProductModal";

export default function HomeModals({
  isModalOpen,
  closeModal,
  modalImageUrl,
  modalImageFrame,
  isImageLoaded,
  setIsImageLoaded,
  modalProduct,
  handleToggleFavorite,
  handleFlyerModal,
  zoomResetKey,
  isFlyerModalOpen,
  flyerBookData,
  baseUrl,
  closeFlyerModal,
  isFlyerLoading,
  flyerBookError,
}) {
  return (
    <>
      {/* Image Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        modalImageUrl={modalImageUrl}
        modalImageFrame={modalImageFrame}
        isImageLoaded={isImageLoaded}
        setIsImageLoaded={setIsImageLoaded}
        modalProduct={modalProduct}
        handleToggleFavorite={handleToggleFavorite}
        handleFlyerModal={handleFlyerModal}
        resetZoomKey={zoomResetKey}
      />

      {/* Flyer modal */}
      {isFlyerModalOpen && (
        <FlyerSlider
          flyerBook={flyerBookData}
          baseUrl={baseUrl}
          isFlyerModalOpen={isFlyerModalOpen}
          closeFlyerModal={closeFlyerModal}
          isLoading={isFlyerLoading}
          error={flyerBookError}
        />
      )}
    </>
  );
}
