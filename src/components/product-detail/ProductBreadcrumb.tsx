import { handleInAppNavigation } from "../../utils/navigation";
import type { Translator } from "../../types/i18n";

export const ProductBreadcrumb = ({
  label,
  t,
  onNavigate,
}: {
  label: string;
  t: Translator;
  onNavigate: (path: string) => void;
}) => (
  <nav
    aria-label={t("detailBreadcrumbLabel")}
    className="flex flex-wrap gap-x-2 text-sm font-semibold text-muted"
  >
    <a
      href="/"
      onClick={(event) => handleInAppNavigation(event, () => onNavigate("/"))}
      className="py-1 hover:text-primary"
    >
      {t("navHome")}
    </a>
    <span aria-hidden="true" className="py-1">
      /
    </span>
    <a
      href="/deskove-hry"
      onClick={(event) => handleInAppNavigation(event, () => onNavigate("/deskove-hry"))}
      className="py-1 hover:text-primary"
    >
      {t("navCatalog")}
    </a>
    <span aria-hidden="true" className="py-1">
      /
    </span>
    <span aria-current="page" className="py-1">
      {label}
    </span>
  </nav>
);
