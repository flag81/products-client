import PropTypes from "prop-types";

export default function ExpiryBadge({ saleEndDate, productOnSale, iconSize = 30 }) {
  if (!saleEndDate) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6,
        height: 34,
      }}
    >
      <img
        src={"/expire2.png"}
        alt="Expires"
        style={{
          width: iconSize,
          height: iconSize,
          objectFit: "contain",
          display: "block",
        }}
      />
      <span style={{ color: productOnSale ? "green" : "red" }} className="bold-text">
        {new Date(saleEndDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })}
      </span>
    </div>
  );
}

ExpiryBadge.propTypes = {
  saleEndDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  productOnSale: PropTypes.bool,
  iconSize: PropTypes.number,
};
