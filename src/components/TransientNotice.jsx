import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const paletteByType = {
  success: {
    background: "#e6f7ec",
    border: "#9bd3ad",
    text: "#14532d",
  },
  error: {
    background: "#fdecec",
    border: "#f3b1b1",
    text: "#7f1d1d",
  },
  info: {
    background: "#e8f1ff",
    border: "#b6d0ff",
    text: "#1e3a8a",
  },
};

export default function TransientNotice({ notice, onDone }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!notice) return undefined;

    const enterTimer = setTimeout(() => {
      setIsVisible(true);
    }, 20);

    const hideDelay = Number(notice.duration) > 0 ? Number(notice.duration) : 2400;
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);

    const doneTimer = setTimeout(() => {
      onDone?.(notice.id);
    }, hideDelay + 280);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
      setIsVisible(false);
    };
  }, [notice, onDone]);

  if (!notice?.message) return null;

  const palette = paletteByType[notice.type] || paletteByType.info;

  return (
    <div
      aria-live="polite"
      role="status"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 2000,
        maxWidth: "min(92vw, 360px)",
        padding: "10px 14px",
        borderRadius: 10,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.background,
        color: palette.text,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 8px 26px rgba(0,0,0,0.18)",
        transform: isVisible ? "translateX(0)" : "translateX(120%)",
        opacity: isVisible ? 1 : 0,
        transition: "transform 250ms ease, opacity 250ms ease",
      }}
    >
      {notice.message}
    </div>
  );
}

TransientNotice.propTypes = {
  notice: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    message: PropTypes.string,
    type: PropTypes.oneOf(["success", "error", "info"]),
    duration: PropTypes.number,
  }),
  onDone: PropTypes.func,
};
