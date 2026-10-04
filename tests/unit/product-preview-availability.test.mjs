import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { generateProductPreviewPages } from "../../scripts/prerender-product-previews.mjs";

const labels = ["Není skladem", "Not in stock", "Out of stock", "Není&nbsp;skladem",
  "https://schema.org/InStock", "Předobjednávka", "Pre-order", "Na dotaz"];
const expected = ["OutOfStock", "OutOfStock", "OutOfStock", "OutOfStock",
  "InStock", "PreOrder", "PreOrder", undefined];

const previewClient = () => ({
  from(tableName) {
    return { select() { return this; }, order() { return this; }, async range() {
      const product = { product_name_normalized: "game", product_name: "Game" };
      return { data: tableName === "catalog_slug_state" ? [product] : labels.map((label, index) => ({
        ...product, seller: `shop-${index}`, latest_price: 0, availability_label: label,
      })), error: null };
    } };
  },
});

test("generated product HTML preserves prices and correct availability for every seller", async () => {
  const directory = await mkdtemp(join(tmpdir(), "product-preview-"));
  try {
    await generateProductPreviewPages({ client: previewClient(), distDir: directory,
      shellHtml: "<html><head></head><body></body></html>", siteUrl: "https://example.com" });
    const html = await readFile(join(directory, "deskove-hry/game/index.html"), "utf8");
    const json = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    const product = JSON.parse(json);
    assert.equal(product.offers.length, labels.length);
    product.offers.forEach((offer, index) => {
      assert.equal(offer.price, 0);
      assert.equal(offer.availability, expected[index] && `https://schema.org/${expected[index]}`);
    });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
