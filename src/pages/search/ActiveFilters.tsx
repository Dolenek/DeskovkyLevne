import type { ActiveFilterChip } from "../../types/filters";
import type { Translator } from "../../types/i18n";

export const ActiveFilters = ({
  chips,
  onRemove,
  onReset,
  t,
}: {
  chips: ActiveFilterChip[];
  onRemove: (key: string) => void;
  onReset: () => void;
  t: Translator;
}) =>
  chips.length === 0 ? null : (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          aria-label={t("catalogRemoveFilter", { value: chip.label })}
          className="inline-flex min-h-11 items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-primary"
        >
          {chip.label}
          <span aria-hidden="true">×</span>
        </button>
      ))}
      <button type="button" onClick={onReset} className="min-h-11 px-2 text-sm font-bold text-primary">
        {t("filteredResetAll")}
      </button>
    </div>
  );
