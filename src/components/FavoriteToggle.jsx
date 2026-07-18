import PropTypes from "prop-types";
import { FiStar } from "react-icons/fi";

export default function FavoriteToggle({ isFavorite, onClick, size = 24 }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderColor: "red",
        cursor: "pointer",
      }}
      role="button"
      onClick={onClick}
    >
      <FiStar
        aria-label={isFavorite ? "Unfavorite" : "Favorite"}
        style={{
          width: size,
          height: size,
          color: "#0f172a",
          fill: isFavorite ? "#facc15" : "transparent",
        }}
      />
    </div>
  );
}

FavoriteToggle.propTypes = {
  isFavorite: PropTypes.bool,
  onClick: PropTypes.func,
  size: PropTypes.number,
};
