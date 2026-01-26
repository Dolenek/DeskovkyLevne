import { LocaleSwitcher } from "./LocaleSwitcher";
import type { TranslationHook } from "../hooks/useTranslation";

interface AppHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchFocus?: () => void;
  onLogoClick?: () => void;
  t: TranslationHook["t"];
}

export const AppHeader = ({
  searchValue,
  onSearchChange,
  onSearchFocus,
  onLogoClick,
  t,
}: AppHeaderProps) => (
  <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-black/95 shadow-lg shadow-black/60">
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 text-white sm:flex-row sm:items-center sm:gap-8 sm:py-4">
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        {onLogoClick ? (
          <button
            type="button"
            onClick={onLogoClick}
            className="text-lg font-bold uppercase tracking-[0.25em] transition hover:text-primary focus:text-primary focus:outline-none sm:text-xl sm:tracking-[0.3em]"
          >
            Deskovky Levně
          </button>
        ) : (
          <div className="text-lg font-bold uppercase tracking-[0.25em] sm:text-xl sm:tracking-[0.3em]">
            Deskovky Levně
          </div>
        )}
        <div className="sm:hidden">
          <LocaleSwitcher size="compact" showLabel={false} />
        </div>
      </div>
      <div className="flex-1">
        <div className="mx-auto flex w-full max-w-xl justify-center">
          <div className="flex w-full items-center gap-2 rounded-full border border-slate-700 bg-black/40 px-2 transition focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(76,144,255,0.4)]">
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={onSearchFocus}
              placeholder={t("searchPlaceholder")}
              className="flex-1 bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-white outline-none placeholder:text-slate-500 sm:py-3 sm:text-center sm:text-base"
            />
            {searchValue ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label={t("clearSearch")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/70 text-slate-300 transition hover:border-primary/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="hidden justify-end sm:flex">
        <LocaleSwitcher />
      </div>
    </div>
  </header>
);
