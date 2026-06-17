import type { MouseEvent } from "react";
import { ProductTile } from "../../components/ProductTile";
import { Icon } from "../../components/ui/Icon";
import type { LocaleKey } from "../../i18n/translations";
import type { ProductSeries } from "../../types/product";
import { formatPrice } from "../../utils/numberFormat";

const shouldUseClientNavigation = (event: MouseEvent<HTMLAnchorElement>) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.altKey &&
  !event.shiftKey;

const getHeroProductMeta = (series: ProductSeries) =>
  series.categoryTags[0] ?? series.availabilityLabel ?? "Desková hra";

const HeroProductImage = ({ series }: { series: ProductSeries }) => (
  <div className="aspect-[5/3] overflow-hidden rounded-lg bg-slate-50">
    {series.heroImage ? (
      <img
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
}: {
  series: ProductSeries;
  locale: LocaleKey;
}) => (
  <div className="mt-5 flex items-end justify-between gap-4">
    <div>
      <p className="text-sm font-bold text-primary">{getHeroProductMeta(series)}</p>
      <h2 className="mt-1 line-clamp-2 text-2xl font-black leading-tight text-navy">
        {series.label}
      </h2>
    </div>
    <p className="shrink-0 text-2xl font-black text-primary">
      {formatPrice(series.latestPrice, series.currency ?? undefined, locale) ?? "--"}
    </p>
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

export const HowItWorks = () => {
  const items = [
    ["store", "1. Sbíráme ceny", "Každý den procházíme desítky e-shopů a sbíráme aktuální ceny deskových her."],
    ["barChart", "2. Sledujeme vývoj", "U každé hry ukládáme historii cen, abyste viděli, jak se mění v čase."],
    ["tag", "3. Porovnáváme nabídky", "Porovnáme nabídky e-shopů a ukážeme vám, kde koupíte nejlevněji právě teď."],
  ] as const;

  return (
    <section>
      <h2 className="text-center text-2xl font-extrabold text-navy">Jak to funguje</h2>
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
  locale,
  onNavigate,
}: {
  series: ProductSeries | null;
  locale: LocaleKey;
  onNavigate: (slug: string) => void;
}) => {
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
        <HeroProductSummary series={series} locale={locale} />
      </a>
    </div>
  );
};

export const FeaturedProducts = ({
  title,
  series,
  locale,
  onNavigate,
  onShowAll,
}: {
  title: string;
  series: ProductSeries[];
  locale: LocaleKey;
  onNavigate: (slug: string) => void;
  onShowAll: () => void;
}) => (
  <section>
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-extrabold text-navy">{title}</h2>
      <button type="button" onClick={onShowAll} className="text-sm font-extrabold text-primary">
        Zobrazit všechny hry →
      </button>
    </div>
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {series.slice(0, 4).map((entry) => (
        <ProductTile key={entry.slug} series={entry} locale={locale} onNavigate={onNavigate} />
      ))}
    </div>
  </section>
);
