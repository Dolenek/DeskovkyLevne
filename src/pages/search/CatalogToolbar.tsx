import type { AvailabilityFilter, CategoryFilter } from "../../types/filters";
import { Icon } from "../../components/ui/Icon";
import type { TranslationKey } from "../../i18n/translations";
import type { Translator } from "../../types/i18n";

interface CatalogToolbarProps {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearchActiveChange: (active: boolean) => void;
  onOpenFilters: () => void;
  categoryFilters: CategoryFilter[];
  availabilityFilter: AvailabilityFilter;
  activeFilterCount: number;
  t: Translator;
  onCategoryToggle: (category: CategoryFilter) => void;
}

const categoryChips = [
  { value: "strategicka", labelKey: "catalogChipStrategic" },
  { value: "rodinna", labelKey: "catalogChipFamily" },
  { value: "kooperativni", labelKey: "catalogChipCooperative" },
  { value: "fantasy", labelKey: "catalogChipFantasy" },
  { value: "ekonomicka", labelKey: "catalogChipEconomic" },
] satisfies Array<{ value: CategoryFilter; labelKey: TranslationKey }>;

export const CatalogToolbar = ({
  searchValue,
  onSearchValueChange,
  onSearchActiveChange,
  onOpenFilters,
  categoryFilters,
  availabilityFilter,
  activeFilterCount,
  t,
  onCategoryToggle,
}: CatalogToolbarProps) => (
  <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center rounded-lg border border-line px-4 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        <Icon name="search" className="h-5 w-5 text-muted" />
        <input
          value={searchValue}
          onChange={(event) => {
            onSearchValueChange(event.target.value);
            onSearchActiveChange(Boolean(event.target.value.trim()));
          }}
          onFocus={() => onSearchActiveChange(true)}
          placeholder={t("catalogSearchPlaceholder")}
          className="min-w-0 flex-1 px-3 py-3 text-sm font-semibold outline-none placeholder:text-muted"
        />
      </div>
      <button
        type="button"
        onClick={onOpenFilters}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-5 py-3 text-sm font-extrabold text-navy"
      >
        <Icon name="filter" className="h-5 w-5" />
        {t("catalogFiltersButton", { count: activeFilterCount })}
      </button>
      <label className="flex items-center gap-3 text-sm font-extrabold text-navy">
        {t("catalogSortLabel")}
        <select className="rounded-lg border border-line px-5 py-3 text-sm font-bold text-navy outline-none">
          <option>{t("catalogSortPopular")}</option>
          <option>{t("catalogSortCheapest")}</option>
          <option>{availabilityFilter === "available" ? t("catalogSortAvailable") : t("catalogSortAll")}</option>
        </select>
      </label>
      <div className="flex gap-2">
        <button className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white" type="button" aria-label={t("catalogGridView")}>
          <Icon name="grid" className="h-5 w-5" />
        </button>
        <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-muted" type="button" aria-label={t("catalogListView")}>
          <Icon name="list" className="h-5 w-5" />
        </button>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap gap-3">
      {categoryChips.map((chip) => {
        const active = categoryFilters.includes(chip.value);
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onCategoryToggle(chip.value)}
            className={`rounded-lg border px-5 py-2 text-sm font-bold ${
              active ? "border-primary bg-primary text-white" : "border-line bg-white text-navy"
            }`}
          >
            {t(chip.labelKey)}
          </button>
        );
      })}
    </div>
  </section>
);
