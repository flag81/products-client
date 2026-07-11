import PropTypes from "prop-types";

export default function StoreBadge({ logoUrl, storeName, size = 30 }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        height: 34,
      }}
    >
      {logoUrl ? (
        <img
          src={`${logoUrl.replace("/upload/", "/upload/w_100,c_scale/")}`}
          alt="Store Logo"
          style={{
            width: size,
            height: size,
            objectFit: "contain",
            objectPosition: "center",
            borderRadius: 8,
            display: "block",
          }}
        />
      ) : (
        <span style={{ color: "black", marginRight: 5 }}>{storeName || "N/A"}</span>
      )}
    </div>
  );
}

StoreBadge.propTypes = {
  logoUrl: PropTypes.string,
  storeName: PropTypes.string,
  size: PropTypes.number,
};
