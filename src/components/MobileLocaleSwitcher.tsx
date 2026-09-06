import { useTranslation } from "../hooks/useTranslation";

export const MobileLocaleSwitcher = () => {
  const { locale, setLocale, t } = useTranslation();
  return (
    <select
      aria-label={t("localeLabel")}
      value={locale}
      onChange={(event) => setLocale(event.target.value === "en" ? "en" : "cs")}
      className="min-h-11 rounded-md border border-line bg-white px-1 text-xs font-bold"
    >
      <option value="cs">CS</option>
      <option value="en">EN</option>
    </select>
  );
};
