import type { TranslationHook } from "../../hooks/useTranslation";

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
  const range = Math.max(maxBound - minBound, 1);

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
    left: `${((activeMin - minBound) / range) * 100}%`,
    right: `${100 - ((activeMax - minBound) / range) * 100}%`,
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
  onlyAvailable: boolean;
  onToggleAvailable: () => void;
  priceFilter: { min: string; max: string };
  priceRangeValues: { min: number | null; max: number | null };
  priceBounds: { min: number; max: number };
  onPriceFilterChange: (key: "min" | "max", value: string) => void;
  onSliderChange: (key: "min" | "max", value: number) => void;
  t: TranslationHook["t"];
}

export const FiltersPanel = ({
  className = "",
  onlyAvailable,
  onToggleAvailable,
  priceFilter,
  priceRangeValues,
  priceBounds,
  onPriceFilterChange,
  onSliderChange,
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
      <button
        type="button"
        onClick={onToggleAvailable}
        className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
          onlyAvailable
            ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
            : "border-slate-700 text-slate-300 hover:border-primary hover:text-white"
        }`}
      >
        {onlyAvailable ? t("availabilityFilterOn") : t("availabilityFilterOff")}
      </button>
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
  </aside>
);
