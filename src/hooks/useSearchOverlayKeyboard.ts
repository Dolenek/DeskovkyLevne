import { useEffect, useState } from "react";

interface UseSearchOverlayKeyboardOptions {
  visible: boolean;
  resultCount: number;
  onSelectActive: (index: number) => void;
  onClose: () => void;
}

const nextIndex = (current: number, resultCount: number) =>
  resultCount === 0 ? -1 : (current + 1 + resultCount) % resultCount;

const previousIndex = (current: number, resultCount: number) =>
  resultCount === 0 ? -1 : (current - 1 + resultCount) % resultCount;

export const useSearchOverlayKeyboard = ({
  visible,
  resultCount,
  onSelectActive,
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
      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        onSelectActive(activeIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, onClose, onSelectActive, resultCount, visible]);

  return { activeIndex, setActiveIndex };
};
