const ENTITY_REPLACEMENTS = {
  "&amp;": "&", "&gt;": ">", "&lt;": "<", "&quot;": '"', "&#39;": "'", "&nbsp;": " ",
};

export const decodeAvailabilityLabel = (value) => Object.entries(ENTITY_REPLACEMENTS).reduce(
  (label, [entity, replacement]) => label.replaceAll(entity, replacement), value,
).replace(/^https?:\/\/schema\.org\//i, "").replace(/\s+/g, " ").trim();

export const normalizeAvailabilityLabel = (value) => decodeAvailabilityLabel(value)
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const AVAILABILITY_PATTERNS = [
  ["preorder", ["preorder", "pre-order", "pre order", "predobjednav", "predprodej"]],
  ["unavailable", ["outofstock", "out of stock", "neni skladem", "neni na sklade",
    "not in stock", "nedostup", "vyprodan"]],
  ["available", ["instock", "in stock", "skladem", "do kosiku"]],
];

export const getAvailabilityTone = (availabilityLabel) => {
  const normalized = normalizeAvailabilityLabel(availabilityLabel ?? "");
  return AVAILABILITY_PATTERNS.find(([, patterns]) =>
    patterns.some((pattern) => normalized.includes(pattern)),
  )?.[0] ?? "unknown";
};

const SCHEMA_AVAILABILITY = {
  available: "https://schema.org/InStock",
  unavailable: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
};

export const mapAvailabilityToSchema = (availabilityLabel) =>
  SCHEMA_AVAILABILITY[getAvailabilityTone(availabilityLabel)];
