import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_RESULT_LIMIT = 10;
const MIN_RESULT_LIMIT = 1;
const BOTTOM_VIEWPORT_GAP = 16;
const FALLBACK_ROW_STEP = 76;

const outerHeight = (element: HTMLElement | null): number => {
  if (!element) return 0;
  const styles = window.getComputedStyle(element);
  const marginTop = Number.parseFloat(styles.marginTop) || 0;
  const marginBottom = Number.parseFloat(styles.marginBottom) || 0;
  return element.getBoundingClientRect().height + marginTop + marginBottom;
};

const verticalPadding = (element: HTMLElement): number => {
  const styles = window.getComputedStyle(element);
  return (
    (Number.parseFloat(styles.paddingTop) || 0) +
    (Number.parseFloat(styles.paddingBottom) || 0)
  );
};

const measureRowStep = (list: HTMLUListElement | null): number => {
  const rows = Array.from(
    list?.querySelectorAll<HTMLElement>('[data-search-result-row="true"]') ?? []
  );
  if (rows.length >= 2) {
    return Math.max(rows[1].offsetTop - rows[0].offsetTop, FALLBACK_ROW_STEP);
  }
  return rows[0]?.getBoundingClientRect().height ?? FALLBACK_ROW_STEP;
};

interface UseDynamicSearchResultLimitOptions {
  visible: boolean;
  resultCount: number;
}

export const useDynamicSearchResultLimit = ({
  visible,
  resultCount,
}: UseDynamicSearchResultLimitOptions) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const hintsRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [visibleResultLimit, setVisibleResultLimit] = useState(DEFAULT_RESULT_LIMIT);

  const updateLimit = useCallback(() => {
    const panel = panelRef.current;
    if (!visible || !panel || resultCount === 0) {
      setVisibleResultLimit(0);
      return;
    }

    const panelTop = panel.getBoundingClientRect().top;
    const availablePanelHeight = window.innerHeight - panelTop - BOTTOM_VIEWPORT_GAP;
    const availableResultHeight =
      availablePanelHeight -
      verticalPadding(panel) -
      outerHeight(headerRef.current) -
      outerHeight(hintsRef.current);
    const rowStep = measureRowStep(listRef.current);
    const fittingRows = Math.floor(availableResultHeight / rowStep);
    const nextLimit = Math.max(MIN_RESULT_LIMIT, fittingRows - 1);
    setVisibleResultLimit(Math.min(resultCount, nextLimit));
  }, [resultCount, visible]);

  useEffect(() => {
    if (!visible || typeof window === "undefined") return;
    updateLimit();
    const observer = new ResizeObserver(updateLimit);
    [panelRef.current, headerRef.current, hintsRef.current, listRef.current].forEach(
      (element) => {
        if (element) {
          observer.observe(element);
        }
      }
    );
    window.addEventListener("resize", updateLimit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLimit);
    };
  }, [updateLimit, visible]);

  return { headerRef, hintsRef, listRef, panelRef, visibleResultLimit };
};
