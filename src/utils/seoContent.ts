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

export const LANDING_SEO_COPY: Record<
  LocaleKey,
  {
    levne: { title: string; description: string; keywords: string[] };
    deskove: { title: string; description: string; keywords: string[] };
  }
> = {
  cs: {
    levne: {
      title: "Levné deskovky | Akční ceny deskových her",
      description:
        "Levné deskovky v českých obchodech na jednom místě. Sledujte aktuální ceny, srovnejte dostupnost a projděte historii cen.",
      keywords: [
        "levné deskovky",
        "sleva deskových her",
        "akcni deskovky",
        "deskové hry cena",
        "srovnání cen deskových her",
      ],
    },
    deskove: {
      title: "Deskové hry | Přehled a ceny deskovek",
      description:
        "Deskové hry od českých prodejců. Prohlédněte si dostupnost, cenu a historii u každého slugu.",
      keywords: [
        "deskové hry",
        "deskovky",
        "srovnání deskových her",
        "cena deskových her",
        "herní kategorie",
      ],
    },
  },
  en: {
    levne: {
      title: "Affordable board games | Czech price tracker",
      description:
        "Affordable board games from Czech retailers. Compare current prices, availability, and price history by slug.",
      keywords: [
        "affordable board games",
        "board game deals",
        "Czech board games",
        "board game price tracker",
      ],
    },
    deskove: {
      title: "Board games | Czech price overview",
      description:
        "Board games from Czech retailers. Explore availability, price, and history per slug.",
      keywords: [
        "board games",
        "Czech board games",
        "price comparison",
        "board game availability",
      ],
    },
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
