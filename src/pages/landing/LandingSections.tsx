import type { MouseEvent } from "react";
import { ProductTile } from "../../components/ProductTile";
import { ProductCardSkeleton, SkeletonBlock, SkeletonImage } from "../../components/skeleton";
import { Icon } from "../../components/ui/Icon";
import type { LocaleKey } from "../../i18n/translations";
import type { Translator } from "../../types/i18n";
import type { ProductSeries } from "../../types/product";
import { formatAvailabilityLabel } from "../../utils/availability";
import { formatPrice } from "../../utils/numberFormat";

const shouldUseClientNavigation = (event: MouseEvent<HTMLAnchorElement>) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.altKey &&
  !event.shiftKey;

const getHeroProductMeta = (series: ProductSeries, locale: LocaleKey, t: Translator) =>
  series.categoryTags[0] ??
  formatAvailabilityLabel(series.availabilityLabel, locale, t("fallbackBoardGame"));

const HeroProductImage = ({ series }: { series: ProductSeries }) => (
  <div className="relative aspect-[5/3] overflow-hidden rounded-lg bg-slate-50">
    {series.heroImage ? (
      <SkeletonImage
        src={series.heroImage}
        alt={series.label}
        className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
      />
    ) : (
      <div className="flex h-full items-center justify-center text-6xl font-black text-line">
        {series.label.charAt(0)}
      </div>
    )}
  </div>
);

const HeroProductSummary = ({
  series,
  locale,
  t,
}: {
  series: ProductSeries;
  locale: LocaleKey;
  t: Translator;
}) => (
  <div className="mt-5 flex items-end justify-between gap-4">
    <div>
      <p className="text-sm font-bold text-primary">{getHeroProductMeta(series, locale, t)}</p>
      <h2 className="mt-1 line-clamp-2 text-2xl font-black leading-tight text-navy">
        {series.label}
      </h2>
    </div>
    <p className="shrink-0 text-2xl font-black text-primary">
      {formatPrice(series.latestPrice, series.currency ?? undefined, locale) ?? "--"}
    </p>
  </div>
);

const HeroPreviewSkeleton = ({ label }: { label: string }) => (
  <div aria-label={label} role="status" className="hidden justify-end lg:flex">
    <div className="w-full max-w-xl rounded-lg border border-line bg-white p-5 shadow-lg">
      <SkeletonBlock className="aspect-[5/3] w-full" />
      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="flex-1">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="mt-2 h-8 w-4/5" />
        </div>
        <SkeletonBlock className="h-8 w-28" />
      </div>
    </div>
  </div>
);

export const StatPill = ({
  icon,
  value,
  label,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  value: string;
  label: string;
}) => (
  <div className="flex items-center gap-3">
    <Icon name={icon} className="h-6 w-6 text-primary" />
    <div>
      <p className="text-lg font-extrabold text-navy">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  </div>
);

export const HowItWorks = ({ t }: { t: Translator }) => {
  const items = [
    ["store", t("landingHowCollectTitle"), t("landingHowCollectBody")],
    ["barChart", t("landingHowTrendTitle"), t("landingHowTrendBody")],
    ["tag", t("landingHowCompareTitle"), t("landingHowCompareBody")],
  ] as const;

  return (
    <section>
      <h2 className="text-center text-2xl font-extrabold text-navy">{t("landingHowTitle")}</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {items.map(([icon, title, body], index) => (
          <article key={title} className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                {index + 1}
              </span>
              <Icon name={icon} className="h-10 w-10 text-primary" />
              <h3 className="font-extrabold text-navy">{title}</h3>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export const HeroPreview = ({
  series,
  loading,
  locale,
  t,
  onNavigate,
}: {
  series: ProductSeries | null;
  loading: boolean;
  locale: LocaleKey;
  t: Translator;
  onNavigate: (slug: string) => void;
}) => {
  if (loading) {
    return <HeroPreviewSkeleton label={t("landingFeaturedLoading")} />;
  }

  if (!series) {
    return null;
  }

  const href = `/deskove-hry/${encodeURIComponent(series.slug)}`;

  return (
    <div className="hidden justify-end lg:flex">
      <a
        href={href}
        onClick={(event) => {
          if (!shouldUseClientNavigation(event)) {
            return;
          }
          event.preventDefault();
          onNavigate(series.slug);
        }}
        className="group w-full max-w-xl rounded-lg border border-line bg-white p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl"
      >
        <HeroProductImage series={series} />
        <HeroProductSummary series={series} locale={locale} t={t} />
      </a>
    </div>
  );
};

export const FeaturedProducts = ({
  title,
  series,
  loading,
  locale,
  t,
  onNavigate,
  onShowAll,
}: {
  title: string;
  series: ProductSeries[];
  loading: boolean;
  locale: LocaleKey;
  t: Translator;
  onNavigate: (slug: string) => void;
  onShowAll: () => void;
}) => (
  <section>
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-extrabold text-navy">{title}</h2>
      <button type="button" onClick={onShowAll} className="text-sm font-extrabold text-primary">
        {t("landingShowAllGames")}
      </button>
    </div>
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)
        : series.slice(0, 4).map((entry) => (
            <ProductTile key={entry.slug} series={entry} locale={locale} t={t} onNavigate={onNavigate} />
          ))}
    </div>
  </section>
);
