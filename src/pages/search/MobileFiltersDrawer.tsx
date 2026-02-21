import { FiltersPanel, type FiltersPanelProps } from "./FiltersPanel";

interface MobileFiltersDrawerProps extends FiltersPanelProps {
  open: boolean;
  closeLabel: string;
  onClose: () => void;
}

export const MobileFiltersDrawer = ({
  open,
  closeLabel,
  onClose,
  ...filterPanelProps
}: MobileFiltersDrawerProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex lg:hidden">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative z-10 h-full w-full max-w-sm overflow-hidden rounded-none border-r border-slate-800 bg-slate-950/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <p className="text-lg font-semibold text-white">
            {filterPanelProps.t("filtersTitle")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-primary hover:text-white"
          >
            {closeLabel}
          </button>
        </div>
        <FiltersPanel
          {...filterPanelProps}
          showTitle={false}
          className="h-[calc(100%-4.5rem)] overflow-y-auto rounded-none border-0 bg-transparent p-5 shadow-none"
        />
      </div>
    </div>
  );
};
