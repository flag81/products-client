import React from "react";
import Placeholder from "react-bootstrap/Placeholder";

const PlaceholderImage = () => {
  return (
    <div style={{ width: "400px", height: "200px", position: "relative" }}>
      <Placeholder as="div" animation="glow" style={{ height: "100%" }}>
        <Placeholder style={{ width: "100%", height: "100%" }} />
      </Placeholder>
    </div>
  );
};

export default PlaceholderImage;