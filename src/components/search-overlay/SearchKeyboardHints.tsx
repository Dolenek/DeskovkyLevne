import type { TranslationHook } from "../../hooks/useTranslation";

interface SearchKeyboardHintsProps {
  t: TranslationHook["t"];
}

const SearchKey = ({ children }: { children: string }) => (
  <kbd className="rounded-md bg-slate-100 px-2 py-1 text-xs font-extrabold text-navy shadow-sm">
    {children}
  </kbd>
);

export const SearchKeyboardHints = ({ t }: SearchKeyboardHintsProps) => (
  <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-muted">
    <span className="flex items-center gap-1">
      <SearchKey>/</SearchKey>
      {t("searchHintFocus")}
    </span>
    <span className="flex items-center gap-1">
      <SearchKey>↑</SearchKey>
      <SearchKey>↓</SearchKey>
      {t("searchHintNavigate")}
    </span>
    <span className="flex items-center gap-1">
      <SearchKey>Enter</SearchKey>
      {t("searchHintOpen")}
    </span>
    <span className="flex items-center gap-1">
      <SearchKey>Esc</SearchKey>
      {t("searchHintClose")}
    </span>
  </div>
);
