import type { CatalogSort, CategoryFilter } from "../../types/filters";
import { Icon } from "../../components/ui/Icon";
import type { Translator } from "../../types/i18n";

interface CatalogToolbarProps {
  onOpenFilters: () => void;
  categoryFilters: CategoryFilter[];
  activeFilterCount: number;
  sort: CatalogSort;
  onSortChange: (sort: CatalogSort) => void;
  t: Translator;
  onCategoryToggle: (category: CategoryFilter) => void;
}

const categoryChips = [
  ["strategicka", "catalogChipStrategic"],
  ["rodinna", "catalogChipFamily"],
  ["kooperativni", "catalogChipCooperative"],
  ["fantasy", "catalogChipFantasy"],
  ["ekonomicka", "catalogChipEconomic"],
] as const;

export const CatalogToolbar = ({
  onOpenFilters,
  categoryFilters,
  activeFilterCount,
  sort,
  onSortChange,
  t,
  onCategoryToggle,
}: CatalogToolbarProps) => (
  <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-white p-3 sm:p-4 lg:flex-row-reverse lg:items-center lg:justify-between">
    <div className="flex items-center justify-between gap-3 lg:justify-end">
      <button
        type="button"
        onClick={onOpenFilters}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-bold lg:hidden"
      >
        <Icon name="filter" className="h-4 w-4" />
        {t("catalogFiltersButton", { count: activeFilterCount })}
      </button>
      <label className="flex min-w-0 items-center gap-2 text-sm font-bold">
        <span className="hidden sm:inline">{t("catalogSort")}</span>
        <select
          aria-label={t("catalogSort")}
          value={sort}
          onChange={(event) => onSortChange(event.target.value as CatalogSort)}
          className="min-h-11 min-w-0 rounded-lg border border-line bg-white px-2"
        >
          <option value="name">{t("catalogSortName")}</option>
          <option value="price_asc">{t("catalogSortPriceAsc")}</option>
          <option value="price_desc">{t("catalogSortPriceDesc")}</option>
        </select>
      </label>
    </div>
    <CategoryChips categoryFilters={categoryFilters} onCategoryToggle={onCategoryToggle} t={t} />
  </section>
);

const CategoryChips = ({
  categoryFilters,
  onCategoryToggle,
  t,
}: Pick<CatalogToolbarProps, "categoryFilters" | "onCategoryToggle" | "t">) => (
  <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap">
    {categoryChips.map(([value, label]) => (
      <button
        key={value}
        type="button"
        aria-pressed={categoryFilters.includes(value)}
        onClick={() => onCategoryToggle(value)}
        className={`min-h-11 shrink-0 rounded-lg border px-3 text-sm font-bold ${categoryFilters.includes(value) ? "border-primary bg-primary text-white" : "border-line text-navy"}`}
      >
        {t(label)}
      </button>
    ))}
  </div>
);
