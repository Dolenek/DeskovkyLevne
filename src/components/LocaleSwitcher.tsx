import { useTranslation } from "../hooks/useTranslation";

const OPTIONS = [
  { value: "cs", label: "Česky" },
  { value: "en", label: "English" },
] as const;

export const LocaleSwitcher = () => {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted">{t("localeLabel")}:</span>
      <div className="flex rounded-full border border-outline bg-surface-muted p-1">
        {OPTIONS.map((option) => {
          const isActive = option.value === locale;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocale(option.value)}
              className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                isActive
                  ? "bg-primary text-white shadow-[0_0_12px_rgba(224,122,47,0.35)]"
                  : "text-muted hover:text-ink"
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
