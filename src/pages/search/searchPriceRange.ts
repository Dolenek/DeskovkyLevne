export interface NormalizedPriceRange {
  min: number | null;
  max: number | null;
}

const parseNonNegativePrice = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  return Math.max(0, numericValue);
};

export const buildNormalizedPriceRange = (
  minValue: string,
  maxValue: string
): NormalizedPriceRange => {
  const parsedMin = parseNonNegativePrice(minValue);
  const parsedMax = parseNonNegativePrice(maxValue);
  if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
    return { min: parsedMax, max: parsedMin };
  }
  return { min: parsedMin, max: parsedMax };
};

export const toPriceFilterStrings = (range: NormalizedPriceRange) => ({
  min: range.min === null ? "" : String(range.min),
  max: range.max === null ? "" : String(range.max),
});
