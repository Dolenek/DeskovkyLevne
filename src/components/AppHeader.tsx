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
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 text-white sm:flex-row sm:items-center sm:gap-8">
      {onLogoClick ? (
        <button
          type="button"
          onClick={onLogoClick}
          className="text-xl font-bold uppercase tracking-[0.3em] transition hover:text-primary focus:text-primary focus:outline-none"
        >
          Tlama Prices
        </button>
      ) : (
        <div className="text-xl font-bold uppercase tracking-[0.3em]">
          Tlama Prices
        </div>
      )}
      <div className="flex-1">
        <div className="mx-auto flex max-w-xl justify-center">
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={onSearchFocus}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border border-slate-700 bg-black/40 px-4 py-3 text-center text-base font-semibold text-white outline-none transition focus:border-primary focus:shadow-[0_0_0_2px_rgba(76,144,255,0.4)]"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
    </div>
  </header>
);
