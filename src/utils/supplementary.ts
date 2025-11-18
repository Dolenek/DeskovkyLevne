import type {
  ProductCatalogIndexRow,
  ProductRow,
  SupplementaryParameter,
} from "../types/product";

const toReadableLabel = (raw: unknown): string => {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const stringifySupplementaryValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => stringifySupplementaryValue(entry))
      .filter((entry) => entry.length > 0)
      .join(", ");
  }
  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const preferred = objectValue.value ?? objectValue.val ?? objectValue.text;
    if (preferred !== undefined) {
      return stringifySupplementaryValue(preferred);
    }
    return JSON.stringify(objectValue);
  }
  return String(value).trim();
};

const entryFromRecord = (
  name: unknown,
  value: unknown
): SupplementaryParameter | null => {
  const readableName = toReadableLabel(name);
  const readableValue = stringifySupplementaryValue(value);
  if (!readableName || !readableValue) {
    return null;
  }
  return { name: readableName, value: readableValue };
};

const objectEntriesToParameters = (
  input: Record<string, unknown>
): SupplementaryParameter[] => {
  const entries = Object.entries(input)
    .map(([name, value]) => entryFromRecord(name, value))
    .filter((entry): entry is SupplementaryParameter => Boolean(entry));
  return entries;
};

const arrayEntriesToParameters = (
  input: unknown[]
): SupplementaryParameter[] => {
  const entries = input
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        const record = item as Record<string, unknown>;
        const nameCandidate =
          record.name ?? record.label ?? record.key ?? record.title;
        return entryFromRecord(
          nameCandidate,
          record.value ?? record.val ?? record.text ?? record.data ?? null
        );
      }
      if (typeof item === "string") {
        const separatorIndex = item.indexOf(":");
        if (separatorIndex !== -1) {
          const name = item.slice(0, separatorIndex).trim();
          const value = item.slice(separatorIndex + 1).trim();
          return entryFromRecord(name, value);
        }
      }
      return null;
    })
    .filter((entry): entry is SupplementaryParameter => Boolean(entry));
  return entries;
};

const parseKeyValueText = (
  value: string
): Record<string, unknown> | null => {
  const lines = value
    .split(/\r?\n|;/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const entries: Record<string, unknown> = {};
  lines.forEach((line) => {
    const separatorIndex = line.indexOf(":");
    const equalIndex = line.indexOf("=");
    const index = separatorIndex >= 0 ? separatorIndex : equalIndex;
    if (index === -1) {
      return;
    }
    const key = line.slice(0, index).trim();
    const rawValue = line.slice(index + 1).trim();
    if (key && rawValue) {
      entries[key] = rawValue;
    }
  });
  return Object.keys(entries).length > 0 ? entries : null;
};

type SupplementarySource =
  | ProductRow["supplementary_parameters"]
  | ProductCatalogIndexRow["supplementary_parameters"];

export const normalizeSupplementaryParameters = (
  source: SupplementarySource
): SupplementaryParameter[] => {
  if (!source) {
    return [];
  }
  if (Array.isArray(source)) {
    return arrayEntriesToParameters(source);
  }
  if (typeof source === "object") {
    return objectEntriesToParameters(source as Record<string, unknown>);
  }
  if (typeof source === "string") {
    try {
      const parsed = JSON.parse(source) as unknown;
      if (Array.isArray(parsed)) {
        return arrayEntriesToParameters(parsed);
      }
      if (parsed && typeof parsed === "object") {
        return objectEntriesToParameters(parsed as Record<string, unknown>);
      }
    } catch {
      // ignore JSON parse errors and try fallback
    }
    const fallbackObject = parseKeyValueText(source);
    if (fallbackObject) {
      return objectEntriesToParameters(fallbackObject);
    }
  }
  return [];
};

const normalizeKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const CATEGORY_KEY = "herni kategorie";

const isCategoryParameter = (name: string): boolean =>
  normalizeKey(name) === CATEGORY_KEY;

const splitCategoryValues = (value: string): string[] =>
  value
    .split(/[\n,;]/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export const extractCategoryTags = (
  parameters: SupplementaryParameter[]
): string[] => {
  const collected = new Set<string>();
  parameters.forEach((parameter) => {
    if (!isCategoryParameter(parameter.name)) {
      return;
    }
    splitCategoryValues(parameter.value).forEach((entry) =>
      collected.add(entry)
    );
  });
  return Array.from(collected).sort((a, b) => a.localeCompare(b, "cs"));
};

