import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductSeries } from "../../types/product";
import { SkeletonImage } from "../skeleton";

const toLargeImageUrl = (url: string): string =>
  url.includes("/related/") ? url.replace("/related/", "/big/") : url;

const isUsableGalleryImage = (url: string): boolean => {
  const normalized = url.toLowerCase();
  return (
    normalized.length > 0 &&
    !normalized.includes("blank.gif") &&
    !normalized.includes("/150x150")
  );
};

export const ProductGallery = ({ series }: { series: ProductSeries }) => {
  const images = useMemo(() => {
    const unique = new Set<string>();
    const ordered: string[] = [];
    const addImage = (url: string | null | undefined) => {
      if (!url) {
        return;
      }
      const largeImage = toLargeImageUrl(url);
      if (!isUsableGalleryImage(largeImage) || unique.has(largeImage)) {
        return;
      }
      unique.add(largeImage);
      ordered.push(largeImage);
    };

    addImage(series.heroImage);
    (series.galleryImages ?? []).forEach(addImage);
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
    <div className="min-w-0 overflow-hidden rounded-lg bg-white">
      <div
        ref={sliderRef}
        className="custom-scrollbar flex min-w-0 snap-x snap-mandatory overflow-x-auto rounded-lg bg-white scroll-smooth"
      >
        {images.length > 0 ? (
          images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative flex aspect-[4/3] min-w-0 w-full flex-shrink-0 snap-center items-center justify-center"
            >
              <SkeletonImage
                src={url}
                alt={`${series.label} ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                className="h-full max-h-[540px] w-full rounded-lg object-contain"
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
        <div className="custom-scrollbar mt-4 flex max-w-full gap-3 overflow-x-auto pb-2">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={`Zobrazit obrázek ${index + 1} z ${images.length}`}
              className={`relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-white p-1 transition ${
                index === activeIndex ? "border-primary ring-2 ring-primary/20" : "border-line"
              }`}
            >
              <SkeletonImage src={url} alt="" loading="lazy" className="h-full w-full rounded-md object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
