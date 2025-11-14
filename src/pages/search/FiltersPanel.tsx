import type { TranslationHook } from "../../hooks/useTranslation";
import type { AvailabilityFilter } from "../../types/filters";

interface PriceRangeSliderProps {
  bounds: { min: number; max: number };
  values: { min: number | null; max: number | null };
  onSliderChange: (key: "min" | "max", value: number) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const PriceRangeSlider = ({
  bounds,
  values,
  onSliderChange,
}: PriceRangeSliderProps) => {
  const minBound = Number.isFinite(bounds.min) ? bounds.min : 0;
  const maxBound =
    Number.isFinite(bounds.max) && bounds.max > minBound
      ? bounds.max
      : minBound + 100;

  const activeMin = clamp(
    values.min ?? minBound,
    minBound,
    values.max ?? maxBound
  );
  const activeMax = clamp(
    values.max ?? maxBound,
    activeMin,
    maxBound
  );

  const highlightStyle = {
    left: `${((activeMin - minBound) / (maxBound - minBound || 1)) * 100}%`,
    right: `${100 - ((activeMax - minBound) / (maxBound - minBound || 1)) * 100}%`,
  };

  const baseRangeClass =
    "absolute left-0 top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent focus:outline-none pointer-events-none";

  return (
    <div className="price-range-slider mt-3 w-full">
      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-800" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={highlightStyle}
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          step={1}
          value={activeMin}
          onChange={(event) =>
            onSliderChange("min", Math.min(Number(event.target.value), activeMax))
          }
          className={`${baseRangeClass} z-20 pointer-events-auto`}
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          step={1}
          value={activeMax}
          onChange={(event) =>
            onSliderChange("max", Math.max(Number(event.target.value), activeMin))
          }
          className={`${baseRangeClass} z-10 pointer-events-auto`}
        />
      </div>
    </div>
  );
};

export interface FiltersPanelProps {
  className?: string;
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
  <aside
    className={`rounded-3xl border border-slate-800 bg-surface/60 p-6 shadow-lg shadow-black/30 ${className}`}
  >
    <h2 className="text-xl font-semibold text-white">{t("filtersTitle")}</h2>
    <div className="mt-6 space-y-3">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {t("filtersAvailability")}
      </p>
      <div className="flex flex-col gap-2">
        {[
          { value: "available" as AvailabilityFilter, label: t("availabilityFilterOn") },
          { value: "preorder" as AvailabilityFilter, label: t("availabilityFilterPreorder") },
          { value: "all" as AvailabilityFilter, label: t("availabilityFilterOff") },
        ].map(({ value, label }) => {
          const active = availabilityFilter === value;
          return (
            <button
              type="button"
              key={value}
              onClick={() => onAvailabilityChange(value)}
              className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 text-slate-300 hover:border-primary hover:text-white"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
    <div className="mt-6 space-y-3">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {t("priceFilterTitle")}
      </p>
      <PriceRangeSlider
        bounds={priceBounds}
        values={priceRangeValues}
        onSliderChange={onSliderChange}
      />
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="number"
          inputMode="decimal"
          value={priceFilter.min}
          onChange={(event) => onPriceFilterChange("min", event.target.value)}
          placeholder="0"
          className="w-full flex-1 rounded-2xl border border-slate-700 bg-black/30 px-4 py-2 text-sm font-semibold text-white outline-none transition focus:border-primary"
        />
        <span className="text-center text-slate-500 sm:w-auto">-</span>
        <input
          type="number"
          inputMode="decimal"
          value={priceFilter.max}
          onChange={(event) => onPriceFilterChange("max", event.target.value)}
          placeholder="1000"
          className="w-full flex-1 rounded-2xl border border-slate-700 bg-black/30 px-4 py-2 text-sm font-semibold text-white outline-none transition focus:border-primary"
        />
      </div>
      <p className="text-xs text-slate-500">{t("priceFilterHint")}</p>
    </div>
    {hasCategoryOptions ? (
      <div className="mt-6 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          {t("filtersCategoryTitle")}
        </p>
        <div className="rounded-2xl border border-slate-800 bg-black/30 px-3 py-2 shadow-inner shadow-black/40">
          <input
            type="text"
            value={categorySearchValue}
            onChange={(event) => onCategorySearchChange(event.target.value)}
            placeholder={t("filtersCategorySearchPlaceholder")}
            className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
        </div>
        <div className="custom-scrollbar flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
          {categoryOptions.length > 0 ? (
            categoryOptions.map((category) => {
              const checked = selectedCategories.includes(category);
              return (
                <label
                  key={category}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                    checked
                      ? "border-primary/60 bg-primary/10 text-white"
                      : "border-slate-800 bg-black/30 text-slate-200 hover:border-primary/60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onCategoryToggle(category)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
                  />
                  <span className="flex-1">{category}</span>
                </label>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-700 px-3 py-2 text-center text-sm text-slate-500">
              {t("filtersCategoryEmpty")}
            </p>
          )}
        </div>
      </div>
    ) : null}
  </aside>
);
