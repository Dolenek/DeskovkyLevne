import { Seo } from "../components/Seo";
import { useTranslation } from "../hooks/useTranslation";

interface NotFoundPageProps {
  path: string;
  onNavigateHome: () => void;
}

export const NotFoundPage = ({ path, onNavigateHome }: NotFoundPageProps) => {
  const { locale } = useTranslation();
  const title = locale === "en" ? "Page not found" : "Stránka nenalezena";
  const description =
    locale === "en"
      ? "The requested page does not exist."
      : "Požadovaná stránka neexistuje.";
  const cta = locale === "en" ? "Go to home page" : "Přejít na hlavní stránku";

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-white sm:px-6 lg:px-10">
      <Seo title={title} description={description} path={path} locale={locale} noIndex />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-slate-800 bg-surface/70 p-8 text-center shadow-2xl shadow-black/40">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">404</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
        <p className="text-base text-slate-300">{description}</p>
        <button
          type="button"
          onClick={onNavigateHome}
          className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/20"
        >
          {cta}
        </button>
      </div>
    </div>
  );
};
