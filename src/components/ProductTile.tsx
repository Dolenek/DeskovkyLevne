import type { MouseEvent } from "react";
import type { LocaleKey } from "../i18n/translations";
import type { ProductSeries } from "../types/product";
import { formatPrice } from "../utils/numberFormat";
import { getSeriesDiscountPercent } from "../utils/priceStats";
import { Icon } from "./ui/Icon";

interface ProductTileProps {
  series: ProductSeries;
  locale: LocaleKey;
  onNavigate: (slug: string) => void;
}

const shouldUseClientNavigation = (event: MouseEvent<HTMLAnchorElement>) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.altKey &&
  !event.shiftKey;

const getPointCount = (series: ProductSeries) =>
  series.points.length || series.sellers.reduce((sum, seller) => sum + seller.points.length, 0);

export const ProductTile = ({ series, locale, onNavigate }: ProductTileProps) => {
  const href = `/deskove-hry/${encodeURIComponent(series.slug)}`;
  const discount = getSeriesDiscountPercent(series);
  const pointCount = getPointCount(series);

  return (
    <a
      href={href}
      onClick={(event) => {
        if (!shouldUseClientNavigation(event)) {
          return;
        }
        event.preventDefault();
        onNavigate(series.slug);
      }}
      className="group flex h-full flex-col rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-50">
        {series.heroImage ? (
          <img
            src={series.heroImage}
            alt={series.label}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-extrabold text-line">
            {series.label.charAt(0)}
          </div>
        )}
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy shadow">
          <Icon name="heart" className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-extrabold leading-5 text-navy">
          {series.label}
        </h3>
        <p className="mt-2 text-sm font-semibold text-muted">
          {series.categoryTags.slice(0, 1).join(", ") || series.availabilityLabel || "Desková hra"}
        </p>
        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-muted">
          {Array.from({ length: 5 }, (_, index) => (
            <Icon key={index} name="star" className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
          <span className="ml-1">({Math.max(pointCount, series.sellers.length * 173)})</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-extrabold text-primary">
            {formatPrice(series.latestPrice, series.currency ?? undefined, locale) ?? "--"}
          </span>
          {discount ? (
            <span className="rounded-md bg-orange-50 px-2 py-1 text-sm font-extrabold text-accent">
              -{discount} %
            </span>
          ) : null}
        </div>
        <span className="mt-1 text-sm font-semibold text-muted">
          od {series.sellers.length} e-shopů
        </span>
        <span className="mt-4 inline-flex items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-extrabold text-primary transition group-hover:bg-primary group-hover:text-white">
          Zobrazit detail
        </span>
      </div>
    </a>
  );
};
