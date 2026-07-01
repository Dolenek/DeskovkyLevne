import { BoardGameVisual } from "../../components/ui/BoardGameVisual";
import { Icon } from "../../components/ui/Icon";
import type { LocaleKey } from "../../i18n/translations";
import type { Translator } from "../../types/i18n";

interface SearchHeroProps {
  total: number;
  locale: LocaleKey;
  t: Translator;
}

export const SearchHero = ({ total, locale, t }: SearchHeroProps) => (
  <section className="grid items-center gap-8 lg:grid-cols-[1fr_0.75fr]">
    <div>
      <p className="text-sm font-bold text-muted">{t("detailBreadcrumb", { value: t("navCatalog") })}</p>
      <h1 className="mt-6 text-4xl font-black leading-tight text-navy sm:text-5xl">
        {t("landingDeskoveHeading")}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        {t("landingDeskoveSubheading")}
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <Icon name="spark" className="h-7 w-7 text-primary" />
          <p className="font-extrabold text-navy">
            {t("filteredResultsShowing", {
              from: 1,
              to: total,
              total: total.toLocaleString(locale === "cs" ? "cs-CZ" : "en-US"),
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="cart" className="h-7 w-7 text-primary" />
          <p className="font-extrabold text-navy">27 {t("landingShopCount")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="refresh" className="h-7 w-7 text-primary" />
          <p className="font-extrabold text-navy">{t("landingDailyUpdates")}</p>
        </div>
      </div>
    </div>
    <div className="hidden justify-end lg:flex">
      <BoardGameVisual />
    </div>
  </section>
);
