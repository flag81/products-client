import React from "react";
import Row from "react-bootstrap/Row";

export default function ProductsGrid({
  children,
  xs = 1,
  sm = 2,
  md = 3,
  lg = 4,
  className = "g-2 justify-content-start",
  style,
}) {
  return (
    <Row xs={xs} sm={sm} md={md} lg={lg} className={className} style={style}>
      {children}
    </Row>
  );
}
