import { useCallback, useEffect, useState } from "react";

export function useHorizontalScrollButtons(scrollRef, deps = []) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;
    const epsilon = 2;
    setCanScrollLeft(left > epsilon);
    setCanScrollRight(maxScrollLeft - left > epsilon);
  }, [scrollRef]);

  const scrollBy = useCallback(
    (direction) => {
      const el = scrollRef.current;
      if (!el) return;
      const amount = Math.max(180, Math.floor(el.clientWidth * 0.7));
      el.scrollBy({ left: direction * amount, behavior: "smooth" });
    },
    [scrollRef]
  );

  useEffect(() => {
    const id = window.requestAnimationFrame(() => updateScrollButtons());
    const el = scrollRef.current;
    if (!el) return () => window.cancelAnimationFrame(id);

    const handle = () => updateScrollButtons();
    el.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);

    return () => {
      window.cancelAnimationFrame(id);
      el.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef, updateScrollButtons, ...deps]);

  return {
    canScrollLeft,
    canScrollRight,
    scrollBy,
    updateScrollButtons,
  };
}
