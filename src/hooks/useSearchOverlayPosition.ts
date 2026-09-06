import { useEffect, useState } from "react";

export const useSearchOverlayPosition = (visible: boolean) => {
  const [top, setTop] = useState(112);
  useEffect(() => {
    if (!visible) return;
    let anchor = document.activeElement?.closest<HTMLElement>('form[role="search"]');
    const updatePosition = () => {
      anchor = document.activeElement?.closest<HTMLElement>('form[role="search"]') ?? anchor;
      if (!anchor) return;
      const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      setTop(Math.max(headerBottom, anchor.getBoundingClientRect().bottom) + 8);
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("focusin", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("focusin", updatePosition);
    };
  }, [visible]);
  return top;
};
