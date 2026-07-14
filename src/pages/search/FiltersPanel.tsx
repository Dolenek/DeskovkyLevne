import type { TranslationHook } from "../../hooks/useTranslation";
import type { FilterOptionGroup } from "../../utils/filterLabels";
import { translateFilterOptionLabel } from "../../utils/filterLabels";
import type {
  AgeRatingFilter,
  AvailabilityFilter,
  CategoryFilter,
  PlayerRangeFilter,
  PlaytimeRangeFilter,
  PriceMovementFilter,
} from "../../types/filters";
import type { FilterOptionRow, FilterOptionsResponse } from "../../services/api/types";
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
  const maxBound = Number.isFinite(bounds.max) && bounds.max > minBound ? bounds.max : minBound + 100;
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

interface OptionGroupProps<T extends string> {
  title: string;
  group?: FilterOptionGroup;
  options: FilterOptionRow[];
  selected: T[];
  onToggle: (value: T) => void;
  t: TranslationHook["t"];
}

const OptionGroup = <T extends string>({ title, group, options, selected, onToggle, t }: OptionGroupProps<T>) => (
  <div className="mt-6 space-y-3">
    <p className="text-sm font-extrabold text-navy">{title}</p>
    <div className="space-y-2">
      {options.slice(0, 6).map((option) => {
        const value = option.value as T;
        const active = selected.includes(value);
        return (
          <label key={option.value} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-muted">
            <input
              type="checkbox"
              checked={active}
              onChange={() => onToggle(value)}
              className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
            />
            {group ? translateFilterOptionLabel(group, option.value, option.label, t) : option.label}
          </label>
        );
      })}
    </div>
  </div>
);

export interface FiltersPanelProps {
  className?: string;
  showTitle?: boolean;
  availabilityFilter: AvailabilityFilter;
  onAvailabilityChange: (filter: AvailabilityFilter) => void;
  priceMovementFilter: PriceMovementFilter | null;
  onSaleToggle: () => void;
  priceFilter: { min: string; max: string };
  priceRangeValues: { min: number | null; max: number | null };
  priceBounds: { min: number; max: number };
  onPriceFilterChange: (key: "min" | "max", value: string) => void;
  onPriceFilterBlur: () => void;
  onSliderChange: (key: "min" | "max", value: number) => void;
  filterOptions: FilterOptionsResponse;
  selectedCategories: CategoryFilter[];
  selectedPlayerRanges: PlayerRangeFilter[];
  selectedPlaytimeRanges: PlaytimeRangeFilter[];
  selectedAgeRatings: AgeRatingFilter[];
  onCategoryToggle: (category: CategoryFilter) => void;
  onPlayerRangeToggle: (range: PlayerRangeFilter) => void;
  onPlaytimeRangeToggle: (range: PlaytimeRangeFilter) => void;
  onAgeRatingToggle: (age: AgeRatingFilter) => void;
  t: TranslationHook["t"];
}

export const FiltersPanel = ({
  className = "",
  showTitle = true,
  availabilityFilter,
  onAvailabilityChange,
  priceMovementFilter,
  onSaleToggle,
  priceFilter,
  priceRangeValues,
  priceBounds,
  onPriceFilterChange,
  onPriceFilterBlur,
  onSliderChange,
  filterOptions,
  selectedCategories,
  selectedPlayerRanges,
  selectedPlaytimeRanges,
  selectedAgeRatings,
  onCategoryToggle,
  onPlayerRangeToggle,
  onPlaytimeRangeToggle,
  onAgeRatingToggle,
  t,
}: FiltersPanelProps) => (
  <aside className={`rounded-lg border border-line bg-white p-5 shadow-sm ${className}`}>
    {showTitle ? (
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-navy">
        <Icon name="filter" className="h-5 w-5 text-primary" />
        {t("filtersTitle")}
      </h2>
    ) : null}

    <div className="mt-6 space-y-3">
      <p className="text-sm font-extrabold text-navy">{t("filtersPrice")}</p>
      <p className="text-sm font-semibold text-muted">
        {priceRangeValues.min ?? priceBounds.min} Kč - {priceRangeValues.max ?? priceBounds.max} Kč
      </p>
      <PriceRangeSlider bounds={priceBounds} values={priceRangeValues} onSliderChange={onSliderChange} />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" min={0} value={priceFilter.min} onChange={(event) => onPriceFilterChange("min", event.target.value)} onBlur={onPriceFilterBlur} placeholder={t("fromPrice")} className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-navy outline-none focus:border-primary" />
        <input type="number" min={0} value={priceFilter.max} onChange={(event) => onPriceFilterChange("max", event.target.value)} onBlur={onPriceFilterBlur} placeholder={t("toPrice")} className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-navy outline-none focus:border-primary" />
      </div>
    </div>

    <OptionGroup title={t("filtersPlayerCount")} options={filterOptions.player_ranges} selected={selectedPlayerRanges} onToggle={onPlayerRangeToggle} t={t} />
    <OptionGroup title={t("filtersPlaytime")} group="playtime_ranges" options={filterOptions.playtime_ranges} selected={selectedPlaytimeRanges} onToggle={onPlaytimeRangeToggle} t={t} />
    <OptionGroup title={t("filtersAgeRating")} options={filterOptions.age_ratings} selected={selectedAgeRatings} onToggle={onAgeRatingToggle} t={t} />
    <OptionGroup title={t("filtersCategoryTitle")} group="categories" options={filterOptions.categories} selected={selectedCategories} onToggle={onCategoryToggle} t={t} />

    <div className="mt-6 space-y-3">
      <p className="text-sm font-extrabold text-navy">{t("filtersAvailability")}</p>
      {filterOptions.availability.map((option) => {
        const value = option.value as AvailabilityFilter;
        return (
          <label key={option.value} className="flex cursor-pointer items-center gap-3 text-sm font-bold text-muted">
            <input type="checkbox" checked={availabilityFilter === value} onChange={() => onAvailabilityChange(availabilityFilter === value ? "all" : value)} className="h-4 w-4 rounded border-line text-primary focus:ring-primary" />
            {translateFilterOptionLabel("availability", option.value, option.label, t)}
          </label>
        );
      })}
      <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-muted">
        <input type="checkbox" checked={priceMovementFilter === "decreased"} onChange={onSaleToggle} className="h-4 w-4 rounded border-line text-primary focus:ring-primary" />
        {t("filtersOnSale")}
      </label>
    </div>
  </aside>
);
