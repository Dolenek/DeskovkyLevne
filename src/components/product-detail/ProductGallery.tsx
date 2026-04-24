import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductSeries } from "../../types/product";

const toLargeImageUrl = (url: string): string =>
  url.includes("/related/") ? url.replace("/related/", "/big/") : url;

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
      if (container) {
        container.scrollTo({ left: container.clientWidth * targetIndex, behavior });
      }
    },
    [images.length]
  );

  useEffect(() => {
    setActiveIndex(0);
    scrollToIndex(0, "auto");
  }, [scrollToIndex, series.slug]);

  return (
    <div className="rounded-lg bg-white">
      <div
        ref={sliderRef}
        className="custom-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-lg bg-white scroll-smooth"
      >
        {images.length > 0 ? (
          images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="flex w-full flex-shrink-0 snap-center items-center justify-center"
            >
              <img
                src={toLargeImageUrl(url)}
                alt={`${series.label} ${index + 1}`}
                className="max-h-[430px] w-full rounded-lg object-contain"
              />
            </div>
          ))
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-slate-100 text-7xl font-black text-line">
            {series.label.charAt(0)}
          </div>
        )}
      </div>
      {images.length > 1 ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => scrollToIndex(index)}
              className={`h-20 w-24 flex-shrink-0 rounded-lg border bg-white p-1 transition ${
                index === activeIndex ? "border-primary ring-2 ring-primary/20" : "border-line"
              }`}
            >
              <img src={url} alt="" className="h-full w-full rounded-md object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
