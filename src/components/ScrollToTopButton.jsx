import React, { useEffect, useState } from "react";
import { FiArrowUp } from "react-icons/fi";

// Floating button that scrolls a given scrollable container back to top once the user has scrolled past a threshold.
export default function ScrollToTopButton({ scrollContainerRef, threshold = 300 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return undefined;

    const handleScroll = () => setVisible(el.scrollTop > threshold);
    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef, threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      data-flash
      onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Kthehu lart"
      title="Kthehu lart"
      style={{
        position: "fixed",
        // Safe-area aware: on a home-bar phone / landscape notch the button must
        // stay a thumb's width away from the OS gesture zone (Stage 0).
        bottom: "calc(24px + var(--safe-bottom, 0px))",
        right: "calc(20px + var(--safe-right, 0px))",
        width: 52,
        height: 52,
        borderRadius: "50%",
        border: "none",
        background: "#1e3a8a",
        color: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 1050,
      }}
    >
      <FiArrowUp size={28} />
    </button>
  );
}
