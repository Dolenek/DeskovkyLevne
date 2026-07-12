import { expect, test } from "playwright/test";
import { mockSearchPageApi, productDetailResponseFromRows } from "./apiMocks";

const detailRow = {
  id: 1,
  product_code: "P-001",
  product_name_original: "Alpha Game",
  product_name_normalized: "alpha-game",
  currency_code: "CZK",
  availability_label: "Skladem",
  stock_status_label: "Skladem",
  price_with_vat: 499,
  list_price_with_vat: 799,
  source_url: "https://example.com/alpha",
  scraped_at: "2026-01-01",
  hero_image_url: null,
  gallery_image_urls: [],
  short_description: "Detail row",
  supplementary_parameters: [],
  metadata: {},
  seller: "tlamagames",
};

test("root renders landing page and catalog lives at deskove-hry", async ({ page }) => {
  await mockSearchPageApi(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Jak to funguje" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Objevte nové deskové hry" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Katalog" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kontakt" })).toHaveCount(0);

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Discover new board games" })).toBeVisible();
  await expect(page.getByPlaceholder("Type a board game name...")).toBeVisible();

  await page.goto("/deskove-hry");
  await expect(page.getByText(/Showing/)).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Catalog" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Filters \(\d+\)/ })).toBeVisible();
});

test("product detail route remains slug based under deskove-hry", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/products/alpha-game") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(productDetailResponseFromRows([detailRow])),
      });
      return;
    }
    if (url.pathname === "/api/v1/catalog") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rows: [detailRow],
          total: 1,
          total_estimate: 1,
          limit: 8,
          offset: 0,
        }),
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
  await expect(page.getByRole("heading", { name: "Alpha Game" }).first()).toBeVisible();
});

test("unknown routes render explicit not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByText(/Page not found|Stránka nenalezena/)).toBeVisible();
  await expect(page.getByRole("button")).toBeVisible();
});

test("unknown product API response renders product not-found state", async ({ page }) => {
	await page.route("**/api/v1/**", async (route) => {
		const url = new URL(route.request().url());
		if (url.pathname === "/api/v1/products/missing-game") {
			await route.fulfill({
				status: 404,
				contentType: "application/json",
				body: JSON.stringify({ error: "product not found", code: "not_found" }),
			});
			return;
		}
		await route.fulfill({ status: 200, contentType: "application/json", body: "{\"rows\":[]}" });
	});

	await page.goto("/deskove-hry/missing-game");
	await expect(page.getByText(/missing-game/)).toBeVisible();
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
});
