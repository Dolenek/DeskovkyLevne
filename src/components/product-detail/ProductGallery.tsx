import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductSeries } from "../../types/product";

const toLargeImageUrl = (url: string): string => {
  if (!url) {
    return url;
  }
  if (url.includes("/related/")) {
    return url.replace("/related/", "/big/");
  }
  return url;
};

export const ProductGallery = ({ series }: { series: ProductSeries }) => {
  const images = useMemo(() => {
    const unique = new Set<string>();
    const ordered: string[] = [];
    if (series.heroImage) {
      unique.add(series.heroImage);
      ordered.push(series.heroImage);
    }
    (series.galleryImages ?? []).forEach((url) => {
      if (url && !unique.has(url)) {
        unique.add(url);
        ordered.push(url);
      }
    });
    return ordered;
  }, [series.galleryImages, series.heroImage]);

  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const maxIndex = Math.max(images.length - 1, 0);
      const targetIndex = Math.min(Math.max(index, 0), maxIndex);
      setActiveIndex(targetIndex);
      const container = sliderRef.current;
      if (!container) {
        return;
      }
      const slideWidth = container.clientWidth;
      container.scrollTo({ left: slideWidth * targetIndex, behavior });
    },
    [images.length]
  );

  useEffect(() => {
    setActiveIndex(0);
    scrollToIndex(0, "auto");
  }, [scrollToIndex, series.productCode]);

  useEffect(() => {
    const container = sliderRef.current;
    if (!container) {
      return;
    }
    let frame: number | null = null;
    const handleScroll = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => {
        const width = container.clientWidth;
        if (width === 0) {
          return;
        }
        const nextIndex = Math.round(container.scrollLeft / width);
        setActiveIndex((current) =>
          current === nextIndex ? current : nextIndex
        );
      });
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      container.removeEventListener("scroll", handleScroll);
    };
  }, [images.length]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3 lg:p-4">
      <div className="flex w-full flex-col gap-4">
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-slate-900/40 px-2 py-4 scroll-smooth"
          >
            {images.length > 0 ? (
              images.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="flex w-full flex-shrink-0 snap-center items-center justify-center px-2"
                >
                  <img
                    src={toLargeImageUrl(url)}
                    alt={`${series.label} slide ${index + 1}`}
                    className="max-h-[400px] w-full rounded-2xl object-contain"
                  />
                </div>
              ))
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-slate-900 text-6xl font-bold text-slate-700">
                {series.label.charAt(0)}
              </div>
            )}
          </div>
        </div>
        {images.length > 1 ? (
          <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1">
            {images.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => scrollToIndex(index)}
                className={`h-20 w-20 flex-shrink-0 rounded-2xl border transition ${
                  index === activeIndex
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={url}
                  alt={`${series.label} thumbnail ${index + 1}`}
                  className="h-full w-full rounded-2xl object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
