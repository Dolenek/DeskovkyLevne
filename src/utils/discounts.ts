import type { DiscountEntry, ProductRow } from "../types/product";

const toNumeric = (value: unknown): number | null => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : null;
};

interface SeriesPair {
  latest: ProductRow;
  previous?: ProductRow;
}

const buildPairs = (rows: ProductRow[]): Map<string, SeriesPair> => {
  const pairs = new Map<string, SeriesPair>();

  for (const row of rows) {
    if (!row.product_code) {
      continue;
    }

    const existing = pairs.get(row.product_code);
    if (!existing) {
      pairs.set(row.product_code, { latest: row });
      continue;
    }

    if (!existing.previous) {
      existing.previous = row;
    }
  }

  return pairs;
};

const toDiscountEntry = (
  latest: ProductRow,
  reference: ProductRow,
  referencePrice: number,
  currentPrice: number
): DiscountEntry => ({
  productCode: latest.product_code,
  productName: latest.product_name ?? reference.product_name ?? latest.product_code,
  currency: latest.currency_code ?? reference.currency_code ?? "CZK",
  url: latest.source_url ?? reference.source_url ?? null,
  previousPrice: referencePrice,
  currentPrice,
  changedAt: latest.scraped_at,
});

export const detectRecentDiscounts = (
  rows: ProductRow[],
  maxResults: number
): DiscountEntry[] => {
  const pairs = buildPairs(rows);
  const actualDrops: DiscountEntry[] = [];
  const fallbackDrops: DiscountEntry[] = [];

  for (const pair of pairs.values()) {
    const latestPrice = toNumeric(pair.latest.price_with_vat);
    const previousPrice = pair.previous
      ? toNumeric(pair.previous.price_with_vat)
      : null;

    if (
      latestPrice !== null &&
      previousPrice !== null &&
      latestPrice < previousPrice
    ) {
      actualDrops.push(
        toDiscountEntry(pair.latest, pair.previous!, previousPrice, latestPrice)
      );
      continue;
    }

    const listPrice = toNumeric(pair.latest.list_price_with_vat);
    if (
      latestPrice !== null &&
      listPrice !== null &&
      listPrice > latestPrice
    ) {
      fallbackDrops.push(
        toDiscountEntry(pair.latest, pair.latest, listPrice, latestPrice)
      );
    }
  }

  const sortedActual = actualDrops.sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  if (sortedActual.length >= maxResults) {
    return sortedActual.slice(0, maxResults);
  }

  const need = maxResults - sortedActual.length;
  const sortedFallback = fallbackDrops.sort(
    (a, b) =>
      (b.previousPrice - b.currentPrice) -
      (a.previousPrice - a.currentPrice)
  );

  return [...sortedActual, ...sortedFallback.slice(0, need)];
};
