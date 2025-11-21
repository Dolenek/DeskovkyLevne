import type { LocaleKey } from "../i18n/translations";
import { buildAbsoluteUrl } from "./urls";

export const HOME_SEO_COPY: Record<LocaleKey, { title: string; description: string; keywords: string[] }> = {
  cs: {
    title: "Deskovky Levně | Srovnávač cen deskových her",
    description:
      "Sledujte historii cen deskových her u českých obchodů, filtrujte dostupnost a kategorie a přejděte na detail slugu s grafem pro každý obchod.",
    keywords: [
      "deskové hry",
      "srovnání cen",
      "cena deskovek",
      "předprodej",
      "skladem",
      "Tlama Games",
      "Planeta Her",
    ],
  },
  en: {
    title: "Deskovky Levně | Czech board game price tracker",
    description:
      "Track board game prices across Czech retailers, filter by availability or category, and open each slug for price history per shop.",
    keywords: [
      "board games",
      "price tracker",
      "Czech board games",
      "preorder",
      "in stock",
      "Tlama Games",
      "Planeta Her",
    ],
  },
};

export const buildHomeStructuredData = (locale: LocaleKey) => {
  const content = HOME_SEO_COPY[locale];
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Deskovky Levně",
    url: buildAbsoluteUrl("/") ?? "/",
    inLanguage: locale === "en" ? "en" : "cs",
    description: content.description,
  };
};
