import type { Translator } from "../../types/i18n";

import { paginationNumbers } from "./paginationNumbers";

interface CatalogPaginationProps {
  page: number;
  count: number;
  onChange: (page: number) => void;
  t: Translator;
}

export const CatalogPagination = ({ page, count, onChange, t }: CatalogPaginationProps) =>
  count <= 1 ? null : (
    <nav
      aria-label={t("catalogPagination")}
      className="flex flex-wrap items-center justify-center gap-2 pt-2"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm font-bold disabled:opacity-40"
      >
        {t("filteredPaginationPrev")}
      </button>
      {paginationNumbers(page, count).map((number) => (
        <button
          key={number}
          type="button"
          aria-label={t("catalogPage", { page: number })}
          aria-current={number === page ? "page" : undefined}
          onClick={() => onChange(number)}
          className={`h-11 w-11 rounded-lg border text-sm font-bold ${number === page ? "border-primary bg-primary text-white" : "border-line bg-white"}`}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === count}
        className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm font-bold disabled:opacity-40"
      >
        {t("filteredPaginationNext")}
      </button>
    </nav>
  );
