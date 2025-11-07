import { useTranslation } from "../hooks/useTranslation";

const OPTIONS = [
  { value: "cs", label: "Česky" },
  { value: "en", label: "English" },
] as const;

export const LocaleSwitcher = () => {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-300">{t("localeLabel")}:</span>
      <div className="flex rounded-full bg-slate-800/70 p-1">
        {OPTIONS.map((option) => {
          const isActive = option.value === locale;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocale(option.value)}
              className={`rounded-full px-4 py-1 text-sm font-medium transition ${
                isActive
                  ? "bg-primary text-white shadow-[0_0_12px_rgba(76,144,255,0.7)]"
                  : "text-slate-300 hover:text-white"
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
