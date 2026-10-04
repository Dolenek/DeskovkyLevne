import { expect, it } from "vitest";
import { buildSeriesFromCatalogIndexRow } from "../../src/utils/catalogTransforms";
import { buildProductStructuredData } from "../../src/utils/productSeo";
import { getAvailabilityTone } from "../../src/utils/availability";

const availabilityCases = [
  ["Není skladem", "unavailable", "OutOfStock"],
  ["Není na skladě", "unavailable", "OutOfStock"],
  ["Not in stock", "unavailable", "OutOfStock"],
  ["Out of stock", "unavailable", "OutOfStock"],
  ["Vyprodáno", "unavailable", "OutOfStock"],
  ["Není&nbsp;skladem", "unavailable", "OutOfStock"],
  ["https://schema.org/InStock", "available", "InStock"],
  ["http://schema.org/OutOfStock", "unavailable", "OutOfStock"],
  ["Skladem", "available", "InStock"],
  ["Pre-order (not in stock)", "preorder", "PreOrder"],
  ["Předobjednávka", "preorder", "PreOrder"],
  ["https://schema.org/PreOrder", "preorder", "PreOrder"],
  ["Na dotaz", "unknown", undefined],
  ["", "unknown", undefined],
] as const;

it.each(availabilityCases)("UI and runtime SEO agree for %s", (label, tone, schema) => {
  const series = buildSeriesFromCatalogIndexRow({
    product_code: "test", product_name_normalized: "test", currency_code: "CZK",
    availability_label: label, stock_status_label: label, latest_price: 0,
    previous_price: null, first_price: null, list_price_with_vat: null,
    source_url: null, latest_scraped_at: null, hero_image_url: null, short_description: null,
  });
  const structured = buildProductStructuredData(series, "https://example.com/test", "cs", "Test");
  const [offer] = (JSON.parse(JSON.stringify(structured)) as { offers: Record<string, unknown>[] }).offers;
  expect(getAvailabilityTone(label)).toBe(tone);
  expect(offer.price).toBe(0);
  expect(offer.availability).toBe(schema ? `https://schema.org/${schema}` : undefined);
  if (!schema) expect(offer).not.toHaveProperty("availability");
});
