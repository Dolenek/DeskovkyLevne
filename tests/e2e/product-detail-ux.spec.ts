import { expect, test } from "playwright/test";
import { productDetailResponseFromRows } from "./apiMocks";

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
    hero_image_url: "https://cdn.example.com/user/shop/related/alpha.jpg",
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
    hero_image_url: "https://cdn.example.com/user/shop/related/alpha.jpg",
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
    price_with_vat: 499,
    list_price_with_vat: null,
    source_url: "https://example.com/najada",
    scraped_at: "2026-06-01",
    hero_image_url: "https://cdn.example.com/user/shop/big/najada.jpg",
    gallery_image_urls: [],
    short_description: "Cheaper seller copy.",
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

const buildHistoryPoint = (priceDate: string, price: number, listPrice: number | null) => ({
  price_date: priceDate,
  price_with_vat: price,
  list_price_with_vat: listPrice,
  currency_code: "CZK",
  scraped_at: `${priceDate}T12:00:00Z`,
  snapshot_count: 1,
});

const historyOnlyProductResponse = {
  product_name_normalized: "history-only-offer",
  sellers: [
    {
      seller: "tlamagames", product_code: "CURRENT", product_name: "History Only Offer",
      currency_code: "CZK", availability_label: "Skladem", stock_status_label: "Skladem",
      latest_price: 600, previous_price: 650, first_price: 650, list_price_with_vat: 700,
      source_url: "https://example.com/current", latest_scraped_at: "2026-06-01T12:00:00Z",
      hero_image_url: null, gallery_image_urls: [], short_description: null,
      supplementary_parameters: [], metadata: {},
      history: [buildHistoryPoint("2026-05-01", 650, 700), buildHistoryPoint("2026-06-01", 600, 700)],
    },
    {
      seller: "archive-shop", product_code: "ARCHIVE", product_name: "History Only Offer",
      currency_code: "CZK", availability_label: "Nedostupné", stock_status_label: "Nedostupné",
      latest_price: null, previous_price: 100, first_price: 100, list_price_with_vat: null,
      source_url: "https://example.com/archive", latest_scraped_at: "2026-05-01T12:00:00Z",
      hero_image_url: null, gallery_image_urls: [], short_description: null,
      supplementary_parameters: [], metadata: {},
      history: [buildHistoryPoint("2026-05-01", 100, null)],
    },
  ],
};

test("product detail shows a skeleton while product data is pending", async ({ page }) => {
  let releaseProductResponse: () => void = () => undefined;
  const productResponsePending = new Promise<void>((resolve) => {
    releaseProductResponse = resolve;
  });

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/products/alpha-game") {
      await productResponsePending;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(productDetailResponseFromRows(productRows)),
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
  await expect(page.getByRole("status", { name: "Nacitani detailu produktu" })).toBeVisible();
  releaseProductResponse();
  await expect(page.getByRole("heading", { name: "Alpha Game" })).toBeVisible();
});

test("product detail removes misleading UI and normalizes seller data", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/products/alpha-game") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(productDetailResponseFromRows(productRows)),
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
  await expect(page).toHaveTitle("Alpha Game | Deskovky levně");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", page.url());
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Srovnejte nabídky hry Alpha Game v 3 e-shopech\. Nejlevněji aktuálně 499,00/
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Alpha Game | Deskovky levně"
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "product");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://cdn.example.com/user/shop/big/alpha.jpg"
  );
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", "Alpha Game");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image"
  );
  const productJsonLd = JSON.parse(await page.locator("#seo-jsonld").textContent() ?? "{}");
  expect(productJsonLd).toMatchObject({
    "@type": "Product",
    name: "Alpha Game",
    url: page.url(),
  });
  expect(productJsonLd.image).toContain("https://cdn.example.com/user/shop/big/alpha.jpg");
  expect(productJsonLd.offers).toHaveLength(3);

  const lowestPriceCard = page.getByText("Aktuálně nejlevnější od").locator("..");
  await expect(lowestPriceCard.getByText(/499,00/)).toBeVisible();
  await expect(page.getByText("A compact card game.")).toHaveCount(2);
  await expect(page.getByText("Cheaper seller copy.")).toHaveCount(0);
  await expect(page.locator('main img[src*="najada.jpg"]')).toHaveCount(0);

  await expect(page.getByRole("link", { name: "Zobrazit nabídky" })).toHaveAttribute("href", "#nabidky");
  await expect(page.getByText("Hlídat cenu")).toHaveCount(0);
  await expect(page.getByText("Zapnout hlídání")).toHaveCount(0);

  await expect(page.getByText("Doprava od")).toHaveCount(0);
  await expect(page.getByText("Hodnocení")).toHaveCount(0);
  await expect(page.getByText("79 Kč")).toHaveCount(0);
  await expect(page.getByText("(1423)")).toHaveCount(0);

  await expect(page.getByText("https://schema.org/InStock")).toHaveCount(0);
  await expect(page.getByText("Skladem >5 ks")).toHaveCount(1);
  await expect(page.getByText("Nedostupné")).toBeVisible();
  await expect(page.locator("#nabidky").getByText("Najáda")).toBeVisible();

  await expect(page.locator('main img[alt^="Alpha Game"]')).toHaveCount(2);
  await expect(page.locator('main img[src*="blank.gif"]')).toHaveCount(0);
  await expect(page.locator('main img[src*="150x150"]')).toHaveCount(0);
  await expect(page.getByText("ZáKladní", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Základní hra / Rozšíření")).toBeVisible();

  await expect(page.getByRole("button", { name: "3M" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Skrýt Tlama Games" })).toBeVisible();
  await expect(page.getByText("Nejlevnější", { exact: true })).toBeVisible();
  await expect(page.getByText("0,00 Kč", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Skrýt Tlama Games" }).click();
  await expect(page.getByRole("button", { name: "Zobrazit Tlama Games" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await page.getByRole("button", { name: "Zobrazit Tlama Games" }).click();
  await expect(page.getByRole("button", { name: "Skrýt Tlama Games" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "1M" }).click();
  await expect(page.getByRole("button", { name: "1M" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Zobrazit nabídky" }).click();
  await expect(page).toHaveURL(/#nabidky$/);
});

test("missing current seller price remains absent while history stays chartable", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/products/history-only-offer") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(historyOnlyProductResponse),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "{\"rows\":[]}" });
  });

  await page.goto("/deskove-hry/history-only-offer");
  const lowestPriceCard = page.getByText("Aktuálně nejlevnější od").locator("..");
  await expect(lowestPriceCard.getByText(/600,00/)).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /600,00/);
  await expect(page.locator("#nabidky").getByText("archive-shop")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /archive-shop/ })).toBeVisible();
});

test("product detail renders mock product when the API cannot be reached", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/products/api-down") {
      await route.abort("failed");
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rows: [] }),
    });
  });

  await page.goto("/deskove-hry/api-down");

  await expect(page.getByRole("heading", { name: "Ukázková hra cenové historie" })).toBeVisible();
  await expect(page.getByText("Failed to fetch")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Historie ceny" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kde koupit nejlevněji" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skrýt Tlama Games" })).toBeVisible();
});

test("product detail rejects unsafe catalog URLs", async ({ page }) => {
  const unsafeRows = [{
    ...productRows[0],
    source_url: "https://user:password@example.com/offer",
    hero_image_url: "javascript:alert(1)",
    gallery_image_urls: [
      "data:image/svg+xml,<svg onload=alert(1)>",
      "https://user:password@example.com/image.jpg",
      "/logo.png",
      "https://cdn.example.com/safe.jpg",
    ],
  }];
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const body = url.pathname === "/api/v1/products/alpha-game"
      ? productDetailResponseFromRows(unsafeRows)
      : { rows: [] };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });

  await page.goto("/deskove-hry/alpha-game");
  await expect(page.getByRole("heading", { name: "Alpha Game" })).toBeVisible();
  await expect(page.locator('#nabidky a[target="_blank"]')).toHaveCount(0);
  await expect(page.locator('main img[src="/logo.png"]').first()).toBeVisible();
  await expect(
    page.locator('main img[src="https://cdn.example.com/safe.jpg"]').first()
  ).toBeVisible();

  const jsonLd = JSON.parse(await page.locator("#seo-jsonld").textContent() ?? "{}");
  expect(jsonLd.offers[0].url).toBe(page.url());
  const renderedHtml = await page.content();
  expect(renderedHtml).not.toContain("javascript:alert");
  expect(renderedHtml).not.toContain("data:image/svg+xml");
  expect(renderedHtml).not.toContain("user:password@");
});
