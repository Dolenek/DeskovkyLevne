import type { MouseEvent } from "react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import type { TranslationHook } from "../hooks/useTranslation";
import { BrandLogo } from "./ui/BrandLogo";
import { Icon } from "./ui/Icon";

interface AppHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchFocus?: () => void;
  onLogoClick?: () => void;
  onNavigatePath?: (path: string) => void;
  activePath?: string;
  t: TranslationHook["t"];
}

const navItems = [
  { href: "/deskove-hry", label: "Katalog" },
];

const shouldNavigateClientSide = (event: MouseEvent<HTMLAnchorElement>) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.altKey &&
  !event.shiftKey;

export const AppHeader = ({
  searchValue,
  onSearchChange,
  onSearchFocus,
  onLogoClick,
  onNavigatePath,
  activePath = "",
  t,
}: AppHeaderProps) => {
  const handleNavigate =
    (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (!onNavigatePath || !shouldNavigateClientSide(event)) {
        return;
      }
      event.preventDefault();
      onNavigatePath(path);
    };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:grid lg:grid-cols-[minmax(260px,1fr)_minmax(0,480px)_minmax(180px,1fr)] lg:items-center lg:px-10">
        <div className="flex items-center justify-between gap-3 lg:justify-start">
          <button
            type="button"
            onClick={onLogoClick}
            className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <BrandLogo compact />
          </button>
          <div className="lg:hidden">
            <LocaleSwitcher size="compact" showLabel={false} />
          </div>

          <nav className="hidden items-center justify-start gap-8 text-sm font-bold text-navy lg:ml-8 lg:flex">
            {navItems.map((item) => {
              const active = activePath.startsWith(item.href);
              return (
                <a
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={handleNavigate(item.href)}
                  className={`border-b-2 py-2 transition ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 lg:justify-self-center lg:w-full">
          <div className="flex min-w-0 flex-1 items-center rounded-lg border border-line bg-white shadow-sm transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <Icon name="search" className="ml-3 h-5 w-5 flex-shrink-0 text-muted" />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={onSearchFocus}
              placeholder={t("searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-semibold text-navy outline-none placeholder:text-muted"
            />
            {searchValue ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label={t("clearSearch")}
                className="mr-2 flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-slate-100 hover:text-navy"
              >
                x
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onSearchFocus}
            className="flex h-11 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition hover:bg-emerald-700"
            aria-label={t("searchLabel")}
          >
            <Icon name="search" className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden justify-self-end xl:block">
          <LocaleSwitcher showLabel={false} />
        </div>
      </div>
    </header>
  );
};
