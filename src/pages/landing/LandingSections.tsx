import { ProductChart } from "../../components/ProductChart";
import { ProductTile } from "../../components/ProductTile";
import { SellerOfferTable } from "../../components/SellerOfferTable";
import { BoardGameVisual } from "../../components/ui/BoardGameVisual";
import { Icon } from "../../components/ui/Icon";
import type { LocaleKey } from "../../i18n/translations";
import type { ProductSeries } from "../../types/product";
import { formatPrice } from "../../utils/numberFormat";
import { getPriceStats } from "../../utils/priceStats";

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

export const HeroPreview = () => (
  <div className="hidden justify-end lg:flex">
    <div className="w-full max-w-xl">
      <BoardGameVisual />
    </div>
  </div>
);

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

export const ShowcaseSections = ({
  showcase,
  locale,
}: {
  showcase: ProductSeries;
  locale: LocaleKey;
}) => (
  <>
    <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <h2 className="text-2xl font-extrabold text-navy">Ukázka historie ceny</h2>
        <div className="mt-5 rounded-lg border border-line bg-white p-5 shadow-sm">
          <h3 className="font-extrabold text-navy">{showcase.label}</h3>
          <p className="mt-1 text-sm text-muted">{showcase.categoryTags[0] ?? "Desková hra"}</p>
          <p className="mt-6 text-sm font-bold text-muted">Nejnižší cena za 6 měsíců:</p>
          <p className="text-4xl font-black text-primary">
            {formatPrice(getPriceStats(showcase).minimum, showcase.currency ?? undefined, locale)}
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <ProductChart series={showcase} locale={locale} priceLabel="Cena" dateLabel="Datum" />
      </div>
    </section>
    <section>
      <h2 className="mb-5 text-2xl font-extrabold text-navy">Kde koupit nejlevněji</h2>
      <SellerOfferTable series={showcase} locale={locale} />
    </section>
  </>
);
