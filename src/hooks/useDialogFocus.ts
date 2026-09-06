import { useEffect, useRef } from "react";

export const useDialogFocus = (open: boolean, onClose: () => void) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(dialog?.querySelectorAll<HTMLElement>('button, input, select, [tabindex="0"]') ?? []).filter(
        (element) => !element.hasAttribute("disabled"),
      );
    focusable()[0]?.focus();
    const onKey = dialogKeyHandler(focusable, onClose);
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) onClose();
    };
    desktop.addEventListener("change", closeOnDesktop);
    dialog?.addEventListener("keydown", onKey);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = previousOverflow;
      dialog?.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [open, onClose]);
  return dialogRef;
};

const dialogKeyHandler = (focusable: () => HTMLElement[], onClose: () => void) => {
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
    if (event.key !== "Tab") return;
    const elements = focusable();
    const first = elements[0],
      last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  return onKey;
};
