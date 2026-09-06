import { useEffect, useState } from "react";

interface UseSearchOverlayKeyboardOptions {
  visible: boolean;
  resultCount: number;
  onClose: () => void;
}

const nextIndex = (current: number, resultCount: number) =>
  resultCount === 0 ? -1 : (current + 1 + resultCount) % resultCount;

const previousIndex = (current: number, resultCount: number) =>
  resultCount === 0 ? -1 : (current - 1 + resultCount) % resultCount;

export const useSearchOverlayKeyboard = ({
  visible,
  resultCount,
  onClose,
}: UseSearchOverlayKeyboardOptions) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!visible) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex((current) => {
      if (resultCount === 0) return -1;
      return current >= 0 && current < resultCount ? current : 0;
    });
  }, [resultCount, visible]);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (!(event.target instanceof HTMLInputElement)) return;
      if (!event.target.closest('form[role="search"]')) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => nextIndex(current, resultCount));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => previousIndex(current, resultCount));
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, resultCount, visible]);

  return { activeIndex, setActiveIndex };
};
