import type { TranslationHook } from "../../hooks/useTranslation";
import type { AvailabilityFilter } from "../../types/filters";
import { Icon } from "../../components/ui/Icon";

interface PriceRangeSliderProps {
  bounds: { min: number; max: number };
  values: { min: number | null; max: number | null };
  onSliderChange: (key: "min" | "max", value: number) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const PriceRangeSlider = ({ bounds, values, onSliderChange }: PriceRangeSliderProps) => {
  const minBound = Number.isFinite(bounds.min) ? bounds.min : 0;
  const maxBound =
    Number.isFinite(bounds.max) && bounds.max > minBound ? bounds.max : minBound + 100;
  const activeMin = clamp(values.min ?? minBound, minBound, values.max ?? maxBound);
  const activeMax = clamp(values.max ?? maxBound, activeMin, maxBound);
  const highlightStyle = {
    left: `${((activeMin - minBound) / (maxBound - minBound || 1)) * 100}%`,
    right: `${100 - ((activeMax - minBound) / (maxBound - minBound || 1)) * 100}%`,
  };

  return (
    <div className="price-range-slider mt-3 w-full">
      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary" style={highlightStyle} />
        {(["min", "max"] as const).map((key, index) => (
          <input
            key={key}
            type="range"
            min={minBound}
            max={maxBound}
            step={1}
            value={key === "min" ? activeMin : activeMax}
            onChange={(event) => onSliderChange(key, Number(event.target.value))}
            className={`pointer-events-auto absolute left-0 top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent focus:outline-none ${
              index === 0 ? "z-20" : "z-10"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export interface FiltersPanelProps {
  className?: string;
  showTitle?: boolean;
  availabilityFilter: AvailabilityFilter;
  onAvailabilityChange: (filter: AvailabilityFilter) => void;
  priceFilter: { min: string; max: string };
  priceRangeValues: { min: number | null; max: number | null };
  priceBounds: { min: number; max: number };
  onPriceFilterChange: (key: "min" | "max", value: string) => void;
  onSliderChange: (key: "min" | "max", value: number) => void;
  categoryOptions: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  hasCategoryOptions: boolean;
  categorySearchValue: string;
  onCategorySearchChange: (value: string) => void;
  t: TranslationHook["t"];
}

export const FiltersPanel = ({
  className = "",
  showTitle = true,
  availabilityFilter,
  onAvailabilityChange,
  priceFilter,
  priceRangeValues,
  priceBounds,
  onPriceFilterChange,
  onSliderChange,
  categoryOptions,
  selectedCategories,
  onCategoryToggle,
  hasCategoryOptions,
  categorySearchValue,
  onCategorySearchChange,
  t,
}: FiltersPanelProps) => (
  <aside className={`rounded-lg border border-line bg-white p-6 shadow-sm ${className}`}>
    {showTitle ? (
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-navy">
        <Icon name="filter" className="h-5 w-5 text-primary" />
        {t("filtersTitle")}
      </h2>
    ) : null}

    <div className="mt-6 space-y-3">
      <p className="text-sm font-extrabold text-navy">{t("priceFilterTitle")}</p>
      <p className="text-sm font-semibold text-muted">
        {priceRangeValues.min ?? priceBounds.min} Kč - {priceRangeValues.max ?? priceBounds.max} Kč
      </p>
      <PriceRangeSlider bounds={priceBounds} values={priceRangeValues} onSliderChange={onSliderChange} />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={priceFilter.min}
          onChange={(event) => onPriceFilterChange("min", event.target.value)}
          placeholder="Od"
          className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-navy outline-none focus:border-primary"
        />
        <input
          type="number"
          value={priceFilter.max}
          onChange={(event) => onPriceFilterChange("max", event.target.value)}
          placeholder="Do"
          className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-navy outline-none focus:border-primary"
        />
      </div>
    </div>

    <div className="mt-6 space-y-3">
      <p className="text-sm font-extrabold text-navy">{t("filtersAvailability")}</p>
      {[
        { value: "available" as AvailabilityFilter, label: "Skladem" },
        { value: "preorder" as AvailabilityFilter, label: "Předprodej" },
        { value: "all" as AvailabilityFilter, label: "Vše" },
      ].map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-3 text-sm font-bold text-muted">
          <input
            type="checkbox"
            checked={availabilityFilter === option.value}
            onChange={() => onAvailabilityChange(option.value)}
            className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
          />
          {option.label}
        </label>
      ))}
    </div>

    {hasCategoryOptions ? (
      <div className="mt-6 space-y-3">
        <p className="text-sm font-extrabold text-navy">{t("filtersCategoryTitle")}</p>
        <input
          type="text"
          value={categorySearchValue}
          onChange={(event) => onCategorySearchChange(event.target.value)}
          placeholder={t("filtersCategorySearchPlaceholder")}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
        />
        <div className="custom-scrollbar flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {categoryOptions.length > 0 ? (
            categoryOptions.slice(0, 24).map((category) => {
              const checked = selectedCategories.includes(category);
              return (
                <label key={category} className="flex cursor-pointer items-center gap-3 text-sm font-bold text-muted">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onCategoryToggle(category)}
                    className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                  />
                  {category}
                </label>
              );
            })
          ) : (
            <p className="text-sm text-muted">{t("filtersCategoryEmpty")}</p>
          )}
        </div>
      </div>
    ) : null}
  </aside>
);
