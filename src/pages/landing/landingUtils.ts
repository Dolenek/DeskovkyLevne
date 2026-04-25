import type { ProductSeries } from "../../types/product";

export const buildLandingCopy = (variant: "levne" | "deskove") =>
  variant === "levne"
    ? {
        heading: "Sledujte historii cen deskových her a nakupujte levněji",
        subheading:
          "Porovnáváme ceny z různých e-shopů, ukazujeme vývoj ceny v čase a pomáháme najít nejlepší nabídku pro vaši oblíbenou deskovku.",
        featuredTitle: "Populární deskové hry",
        cta: "Najděte nejlepší cenu své příští deskovky",
      }
    : {
        heading: "Katalog deskových her s přehledem cen",
        subheading:
          "Procházejte hry podle slugu, dostupnosti a historie cen napříč českými e-shopy.",
        featuredTitle: "Vybrané deskové hry",
        cta: "Najděte svou další oblíbenou deskovku",
      };

export const collectVisualImages = (series: ProductSeries[]) =>
  series
    .flatMap((entry) => [entry.heroImage, ...(entry.galleryImages ?? [])])
    .filter((url): url is string => Boolean(url))
    .slice(0, 4);
