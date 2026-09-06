import { FiltersPanel, type FiltersPanelProps } from "./FiltersPanel";
import { useDialogFocus } from "../../hooks/useDialogFocus";

interface MobileFiltersDrawerProps extends FiltersPanelProps {
  open: boolean;
  closeLabel: string;
  resultCount: number;
  loading: boolean;
  onClose: () => void;
}

export const MobileFiltersDrawer = ({
  open,
  closeLabel,
  resultCount,
  loading,
  onClose,
  ...filterPanelProps
}: MobileFiltersDrawerProps) => {
  const dialogRef = useDialogFocus(open, onClose);
  if (!open) return null;
  const { t } = filterPanelProps;
  return (
    <div className="fixed inset-0 z-[60] flex lg:hidden">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-navy/40"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("filtersTitle")}
        className="relative z-10 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-lg font-bold">{t("filtersTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-line px-3 text-sm font-bold"
          >
            {closeLabel}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FiltersPanel
            {...filterPanelProps}
            showTitle={false}
            className="rounded-none border-0 p-4 shadow-none"
          />
        </div>
        <FilterResultsButton onClose={onClose} loading={loading} resultCount={resultCount} t={t} />
      </div>
    </div>
  );
};

const FilterResultsButton = ({
  onClose,
  loading,
  resultCount,
  t,
}: Pick<MobileFiltersDrawerProps, "onClose" | "loading" | "resultCount" | "t">) => (
  <div className="shrink-0 border-t border-line bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
    <button
      type="button"
      onClick={onClose}
      className="min-h-12 w-full rounded-lg bg-primary px-4 py-3 font-bold text-white"
    >
      {loading ? t("catalogShowResults") : t("catalogShowCount", { count: resultCount })}
    </button>
  </div>
);
