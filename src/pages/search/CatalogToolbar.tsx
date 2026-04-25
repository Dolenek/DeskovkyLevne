import type { AvailabilityFilter, CategoryFilter } from "../../types/filters";
import { Icon } from "../../components/ui/Icon";

interface CatalogToolbarProps {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearchActiveChange: (active: boolean) => void;
  onOpenFilters: () => void;
  categoryFilters: CategoryFilter[];
  availabilityFilter: AvailabilityFilter;
  activeFilterCount: number;
  onCategoryToggle: (category: CategoryFilter) => void;
}

const categoryChips = [
  { value: "strategicka", label: "Strategická" },
  { value: "rodinna", label: "Rodinná" },
  { value: "fantasy", label: "Fantasy" },
  { value: "kooperativni", label: "Kooperativní" },
  { value: "ekonomicka", label: "Ekonomická" },
] satisfies Array<{ value: CategoryFilter; label: string }>;

export const CatalogToolbar = ({
  searchValue,
  onSearchValueChange,
  onSearchActiveChange,
  onOpenFilters,
  categoryFilters,
  availabilityFilter,
  activeFilterCount,
  onCategoryToggle,
}: CatalogToolbarProps) => (
  <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center rounded-lg border border-line px-4">
        <Icon name="search" className="h-5 w-5 text-muted" />
        <input
          value={searchValue}
          onChange={(event) => {
            onSearchValueChange(event.target.value);
            onSearchActiveChange(Boolean(event.target.value.trim()));
          }}
          onFocus={() => onSearchActiveChange(true)}
          placeholder="Zadejte název hry, kategorii nebo vydavatele..."
          className="min-w-0 flex-1 px-3 py-3 text-sm font-semibold outline-none placeholder:text-muted"
        />
      </div>
      <button
        type="button"
        onClick={onOpenFilters}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-5 py-3 text-sm font-extrabold text-navy"
      >
        <Icon name="filter" className="h-5 w-5" />
        Filtry ({activeFilterCount})
      </button>
      <select className="rounded-lg border border-line px-5 py-3 text-sm font-bold text-navy outline-none">
        <option>Nejpopulárnější</option>
        <option>Nejlevnější</option>
        <option>{availabilityFilter === "available" ? "Skladem" : "Vše"}</option>
      </select>
      <div className="flex gap-2">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white"
          type="button"
        >
          <Icon name="grid" className="h-5 w-5" />
        </button>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-muted"
          type="button"
        >
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
            {chip.label}
          </button>
        );
      })}
    </div>
  </section>
);
