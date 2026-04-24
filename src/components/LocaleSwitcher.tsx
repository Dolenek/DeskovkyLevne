import { useTranslation } from "../hooks/useTranslation";

const OPTIONS = [
  { value: "cs", label: "Česky" },
  { value: "en", label: "English" },
] as const;

interface LocaleSwitcherProps {
  size?: "default" | "compact";
  showLabel?: boolean;
  className?: string;
}

export const LocaleSwitcher = ({
  size = "default",
  showLabel = true,
  className = "",
}: LocaleSwitcherProps) => {
  const { locale, setLocale, t } = useTranslation();
  const isCompact = size === "compact";
  const labelClasses = isCompact ? "text-xs" : "text-sm";
  const buttonClasses = isCompact ? "px-3 py-1 text-xs" : "px-4 py-1 text-sm";
  const containerClasses = isCompact ? "gap-2" : "gap-3";

  return (
    <div className={`flex items-center ${containerClasses} ${className}`}>
      {showLabel ? (
        <span className={`${labelClasses} text-muted`}>{t("localeLabel")}:</span>
      ) : null}
      <div className="flex rounded-lg border border-line bg-slate-50 p-1">
        {OPTIONS.map((option) => {
          const isActive = option.value === locale;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocale(option.value)}
              className={`rounded-md ${buttonClasses} font-bold transition ${
                isActive ? "bg-primary text-white shadow-sm" : "text-muted hover:text-navy"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
