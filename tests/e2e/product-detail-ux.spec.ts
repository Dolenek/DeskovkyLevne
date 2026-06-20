import { expect, test } from "playwright/test";

const productRows = [
  {
    id: 1,
    product_code: "P-TLAMA",
    product_name_original: "Alpha Game",
    product_name_normalized: "alpha-game",
    currency_code: "CZK",
    availability_label: "Skladem &gt;5 ks",
    stock_status_label: "Skladem",
    price_with_vat: 599,
    list_price_with_vat: 799,
    source_url: "https://example.com/tlama",
    scraped_at: "2026-05-01",
    hero_image_url: "https://cdn.example.com/user/shop/big/alpha.jpg",
    gallery_image_urls: [
      "https://cdn.example.com/user/shop/related/alpha.jpg",
      "https://cdn.example.com/user/shop/big/alpha-side.jpg",
      "https://cdn.example.com/user/shop/related/alpha-side.jpg",
      "https://img.example.com/150x150f/thumb.jpg",
      "https://example.com/blank.gif",
    ],
    short_description: "A compact card game.",
    supplementary_parameters: [
      { name: "1. Základní hra / Rozšíření", value: "Základní hra" },
      { name: "2. Minimální věk", value: "8" },
    ],
    metadata: {},
    seller: "tlamagames",
  },
  {
    id: 2,
    product_code: "P-TLAMA",
    product_name_original: "Alpha Game",
    product_name_normalized: "alpha-game",
    currency_code: "CZK",
    availability_label: "Skladem &gt;5 ks",
    stock_status_label: "Skladem",
    price_with_vat: 529,
    list_price_with_vat: 799,
    source_url: "https://example.com/tlama",
    scraped_at: "2026-06-01",
    hero_image_url: "https://cdn.example.com/user/shop/big/alpha.jpg",
    gallery_image_urls: [],
    short_description: "A compact card game.",
    supplementary_parameters: [],
    metadata: {},
    seller: "tlamagames",
  },
  {
    id: 3,
    product_code: "P-NAJADA",
    product_name_original: "Alpha Game",
    product_name_normalized: "alpha-game",
    currency_code: "CZK",
    availability_label: "https://schema.org/InStock",
    stock_status_label: "Skladem",
    price_with_vat: 539,
    list_price_with_vat: null,
    source_url: "https://example.com/najada",
    scraped_at: "2026-06-01",
    hero_image_url: null,
    gallery_image_urls: [],
    short_description: null,
    supplementary_parameters: [],
    metadata: {},
    seller: "najada",
  },
  {
    id: 4,
    product_code: "P-IMAGO",
    product_name_original: "Alpha Game",
    product_name_normalized: "alpha-game",
    currency_code: "CZK",
    availability_label: "nedostupne",
    stock_status_label: "Nedostupné",
    price_with_vat: 589,
    list_price_with_vat: null,
    source_url: "https://example.com/imago",
    scraped_at: "2026-06-01",
    hero_image_url: null,
    gallery_image_urls: [],
    short_description: null,
    supplementary_parameters: [],
    metadata: {},
    seller: "imago",
  },
];

test("product detail removes misleading UI and normalizes seller data", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/products/alpha-game") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows: productRows }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rows: [] }),
    });
  });

  await page.goto("/deskove-hry/alpha-game");

  await expect(page.getByRole("heading", { name: "Alpha Game" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zobrazit nabídky" })).toHaveAttribute("href", "#nabidky");
  await expect(page.getByText("Hlídat cenu")).toHaveCount(0);
  await expect(page.getByText("Zapnout hlídání")).toHaveCount(0);

  await expect(page.getByText("Doprava od")).toHaveCount(0);
  await expect(page.getByText("Hodnocení")).toHaveCount(0);
  await expect(page.getByText("79 Kč")).toHaveCount(0);
  await expect(page.getByText("(1423)")).toHaveCount(0);

  await expect(page.getByText("https://schema.org/InStock")).toHaveCount(0);
  await expect(page.getByText("Skladem >5 ks")).toBeVisible();
  await expect(page.getByText("Nedostupné")).toBeVisible();
  await expect(page.getByText("Najáda")).toBeVisible();

  await expect(page.locator('main img[alt^="Alpha Game"]')).toHaveCount(2);
  await expect(page.locator('main img[src*="blank.gif"]')).toHaveCount(0);
  await expect(page.locator('main img[src*="150x150"]')).toHaveCount(0);
  await expect(page.getByText("ZáKladní")).toHaveCount(0);
  await expect(page.getByText("Základní hra / Rozšíření")).toBeVisible();

  await page.getByRole("button", { name: "1M" }).click();
  await expect(page.getByRole("button", { name: "1M" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Zobrazit nabídky" }).click();
  await expect(page).toHaveURL(/#nabidky$/);
});
