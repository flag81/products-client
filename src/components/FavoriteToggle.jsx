import PropTypes from "prop-types";
import * as m from "motion/react-m";
import { FiStar } from "react-icons/fi";
import { STAR_TAP } from "../motion/variants";

export default function FavoriteToggle({ isFavorite, onClick, size = 24 }) {
  return (
    <m.div
      data-flash
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderColor: "red",
        cursor: "pointer",
      }}
      role="button"
      whileTap={STAR_TAP}
      onClick={onClick}
    >
      <FiStar
        aria-label={isFavorite ? "Unfavorite" : "Favorite"}
        style={{
          width: size,
          height: size,
          color: "#0f172a",
          fill: isFavorite ? "#facc15" : "transparent",
          transition: "fill 180ms ease-out",
        }}
      />
    </m.div>
  );
}

FavoriteToggle.propTypes = {
  isFavorite: PropTypes.bool,
  onClick: PropTypes.func,
  size: PropTypes.number,
};
