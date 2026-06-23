import React from "react";

export default function StoreBadge({ logoUrl, storeName }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        alignContent: "center",
        marginBottom: 5,
        paddingTop: 5,
      }}
    >
      {logoUrl ? (
        <img
          src={`${logoUrl.replace("/upload/", "/upload/w_100,c_scale/")}`}
          alt="Store Logo"
          style={{ width: 50 }}
        />
      ) : (
        <span style={{ color: "black", marginRight: 5 }}>{storeName || "N/A"}</span>
      )}
    </div>
  );
}
