import type { LocaleKey } from "../i18n/translations";

import { decodeAvailabilityLabel, normalizeAvailabilityLabel } from "../../shared/availability.mjs";
export { getAvailabilityTone } from "../../shared/availability.mjs";

const capitalizeFirst = (value: string): string =>
  value.length > 0 ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

const AVAILABILITY_COPY: Record<
  LocaleKey,
  { available: string; unavailable: string; preorder: string; unknown: string }
> = {
  cs: {
    available: "Skladem",
    unavailable: "Nedostupné",
    preorder: "Předobjednávka",
    unknown: "Dostupnost neznámá",
  },
  en: {
    available: "In stock",
    unavailable: "Unavailable",
    preorder: "Preorder",
    unknown: "Availability unknown",
  },
};

export const formatAvailabilityLabel = (
  availabilityLabel: string | null | undefined,
  locale: LocaleKey = "cs",
  fallback = AVAILABILITY_COPY[locale].unknown,
): string => {
  if (!availabilityLabel) {
    return fallback;
  }

  const decoded = decodeAvailabilityLabel(availabilityLabel);
  if (!decoded) {
    return fallback;
  }

  const normalized = normalizeAvailabilityLabel(decoded);
  if (["instock", "in stock", "skladem", "do kosiku"].includes(normalized)) {
    return AVAILABILITY_COPY[locale].available;
  }
  if (["outofstock", "out of stock", "nedostupne", "vyprodano"].includes(normalized)) {
    return AVAILABILITY_COPY[locale].unavailable;
  }
  if (["preorder", "pre order", "predobjednavka"].includes(normalized)) {
    return AVAILABILITY_COPY[locale].preorder;
  }

  return capitalizeFirst(decoded);
};
