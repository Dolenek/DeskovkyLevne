import { expect, it } from "vitest";
import type { ProductSeries, SellerSeries } from "../../src/types/product";
import { currentOffers, lowestAvailableSeller } from "../../src/utils/productOffers";
import { productFacts, prioritizeParameters } from "../../src/utils/productFacts";

const seller = (name: string, price: number | null, availability: string): SellerSeries => ({
  seller: name,
  label: name,
  productCode: name,
  latestPrice: price,
  availabilityLabel: availability,
  listPrice: null,
  previousPrice: null,
  firstPrice: null,
  latestScrapedAt: null,
  points: [],
  supplementaryParameters: [],
  categoryTags: [],
});
const product = (sellers: SellerSeries[]) => ({ sellers }) as ProductSeries;

it("prefers confirmed stock over cheaper unavailable and unknown offers", () => {
  const series = product([
    seller("sold-out", 1, "Vyprodáno"),
    seller("stock", 100, "Skladem"),
    seller("unknown", 2, ""),
    seller("history", null, "Skladem"),
  ]);
  expect(currentOffers(series).map((entry) => entry.seller)).toEqual(["stock", "sold-out", "unknown"]);
  expect(lowestAvailableSeller(series)?.seller).toBe("stock");
});
it("preserves free offers and does not invent stock when none is confirmed", () => {
  expect(lowestAvailableSeller(product([seller("free", 0, "https://schema.org/InStock")]))?.latestPrice).toBe(
    0,
  );
  expect(lowestAvailableSeller(product([seller("preorder", 100, "Předobjednávka")]))).toBeNull();
});
it("prioritizes gameplay facts and keeps secondary parameters accessible", () => {
  const parameters = [
    { name: "EAN", value: "123" },
    { name: "Minimální počet hráčů", value: "2" },
    { name: "Maximální počet hráčů", value: "4" },
    { name: "Jazyk hry", value: "český" },
  ];
  expect(productFacts(parameters, (key) => key)).toEqual([
    { name: "detailPlayers", value: "2–4" },
    { name: "detailLanguage", value: "český" },
  ]);
  expect(prioritizeParameters(parameters).at(-1)?.name).toBe("EAN");
  expect(prioritizeParameters(parameters)).toHaveLength(4);
});

it("does not highlight natural-language out-of-stock labels", () => {
  for (const label of ["Out of stock", "Není skladem", "Not in stock", "Pre-order"]) {
    expect(lowestAvailableSeller(product([seller("shop", 10, label)]))).toBeNull();
  }
});
