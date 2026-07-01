import type { LocaleKey } from "../../i18n/translations";
import type { Translator } from "../../types/i18n";

export const buildLandingCopy = (
  variant: "levne" | "deskove",
  t: Translator
) =>
  variant === "levne"
    ? {
        heading: t("landingLevneHeading"),
        subheading: t("landingLevneSubheading"),
        featuredTitle: t("landingLevneFeaturedTitle"),
        cta: t("landingLevneCta"),
      }
    : {
        heading: t("landingDeskoveHeading"),
        subheading: t("landingDeskoveSubheading"),
        featuredTitle: t("landingDeskoveFeaturedTitle"),
        cta: t("landingDeskoveCta"),
      };

export const toAppLocaleTag = (locale: LocaleKey) =>
  locale === "cs" ? "cs-CZ" : "en-US";
