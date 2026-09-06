import { useLayoutEffect } from "react";

export const saveScrollPosition = () => {
  window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, "");
};

export const useScrollRestoration = (navigationKey: number) => {
  useLayoutEffect(() => {
    const previousMode = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const position = Math.max(0, Number(window.history.state?.scrollY) || 0);
    let restored = false;
    const restore = () => {
      if (restored || document.querySelector('[aria-busy="true"]')) return;
      if (document.documentElement.scrollHeight - window.innerHeight < position) return;
      window.scrollTo({ top: position, behavior: "instant" });
      restored = true;
    };
    const stopObserving = observeScrollTarget(restore);
    const capture = () => {
      if (restored) saveScrollPosition();
    };
    const cancelRestore = () => {
      restored = true;
    };
    window.addEventListener("scroll", capture, { passive: true });
    window.addEventListener("wheel", cancelRestore, { passive: true });
    window.addEventListener("touchstart", cancelRestore, { passive: true });
    return () => {
      stopObserving();
      window.removeEventListener("scroll", capture);
      window.removeEventListener("wheel", cancelRestore);
      window.removeEventListener("touchstart", cancelRestore);
      window.history.scrollRestoration = previousMode;
    };
  }, [navigationKey]);
};

const observeScrollTarget = (restore: () => void) => {
  const resize = new ResizeObserver(restore);
  const mutation = new MutationObserver(restore);
  resize.observe(document.body);
  mutation.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["aria-busy"],
  });
  const frame = requestAnimationFrame(restore);
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    mutation.disconnect();
  };
};
