import type { MouseEvent } from "react";

export const handleInAppNavigation = (
  event: MouseEvent<HTMLElement>,
  navigate: () => void
) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return;
  }
  event.preventDefault();
  navigate();
};
