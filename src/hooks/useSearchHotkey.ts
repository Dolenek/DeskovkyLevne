import { useEffect } from "react";
import type { RefObject } from "react";

interface UseSearchHotkeyOptions {
  inputRef: RefObject<HTMLInputElement | null>;
  onActivate: () => void;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
};

const hasModifierKey = (event: KeyboardEvent) =>
  event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

const isSlashKey = (event: KeyboardEvent) =>
  event.key === "/" || event.key === "Slash" || event.code === "Slash";

export const useSearchHotkey = ({
  inputRef,
  onActivate,
}: UseSearchHotkeyOptions) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSlashKey(event) || hasModifierKey(event) || isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
      onActivate();
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputRef, onActivate]);
};
