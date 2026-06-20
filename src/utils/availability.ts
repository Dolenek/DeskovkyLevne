export type AvailabilityTone = "available" | "unavailable" | "preorder" | "unknown";

const ENTITY_REPLACEMENTS: Record<string, string> = {
  "&amp;": "&",
  "&gt;": ">",
  "&lt;": "<",
  "&quot;": "\"",
  "&#39;": "'",
  "&nbsp;": " ",
};

const decodeSimpleEntities = (value: string): string =>
  Object.entries(ENTITY_REPLACEMENTS).reduce(
    (current, [entity, replacement]) => current.replaceAll(entity, replacement),
    value
  );

const normalizeForMatch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const stripSchemaPrefix = (value: string): string =>
  value.replace(/^https?:\/\/schema\.org\//i, "");

const capitalizeFirst = (value: string): string =>
  value.length > 0 ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

export const formatAvailabilityLabel = (
  availabilityLabel: string | null | undefined,
  fallback = "Dostupnost neznámá"
): string => {
  if (!availabilityLabel) {
    return fallback;
  }

  const decoded = decodeSimpleEntities(stripSchemaPrefix(availabilityLabel).trim())
    .replace(/\s+/g, " ")
    .trim();
  if (!decoded) {
    return fallback;
  }

  const normalized = normalizeForMatch(decoded);
  if (["instock", "in stock", "skladem", "do kosiku"].includes(normalized)) {
    return "Skladem";
  }
  if (["outofstock", "out of stock", "nedostupne", "vyprodano"].includes(normalized)) {
    return "Nedostupné";
  }
  if (["preorder", "pre order", "predobjednavka"].includes(normalized)) {
    return "Předobjednávka";
  }

  return capitalizeFirst(decoded);
};

export const getAvailabilityTone = (
  availabilityLabel: string | null | undefined
): AvailabilityTone => {
  if (!availabilityLabel) {
    return "unknown";
  }
  const normalized = normalizeForMatch(stripSchemaPrefix(decodeSimpleEntities(availabilityLabel)));
  if (normalized.includes("preorder") || normalized.includes("predobjednav")) {
    return "preorder";
  }
  if (
    normalized.includes("outofstock") ||
    normalized.includes("nedostup") ||
    normalized.includes("vyprodan")
  ) {
    return "unavailable";
  }
  if (
    normalized.includes("instock") ||
    normalized.includes("skladem") ||
    normalized.includes("do kosiku")
  ) {
    return "available";
  }
  return "unknown";
};
