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
  <header className="sticky top-0 z-50 w-full border-b border-outline/70 bg-surface/90 backdrop-blur">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
          <span className="font-display text-lg font-semibold">DL</span>
        </div>
        {onLogoClick ? (
          <button
            type="button"
            onClick={onLogoClick}
            className="text-lg font-semibold uppercase tracking-[0.2em] text-ink transition hover:text-primary focus:text-primary focus:outline-none"
          >
            Deskovky Levně
          </button>
        ) : (
          <div className="text-lg font-semibold uppercase tracking-[0.2em] text-ink">
            Deskovky Levně
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="mx-auto flex max-w-xl justify-center">
          <label className="relative w-full">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
              ⌕
            </span>
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={onSearchFocus}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-full border border-outline bg-white/70 py-3 pl-10 pr-4 text-left text-base font-semibold text-ink shadow-float outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(224,122,47,0.2)]"
            />
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
    </div>
  </header>
);
