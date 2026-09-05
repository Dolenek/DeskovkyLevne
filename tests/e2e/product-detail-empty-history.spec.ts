import { expect, test } from "playwright/test";
import { productDetailResponseFromRows } from "./apiMocks";

const productWithoutHistory = (price: number | null) => {
  const response = productDetailResponseFromRows([{
    product_name_normalized: "no-history",
    product_name_original: "Game without history",
    seller: "tlamagames",
    latest_price: price,
    currency_code: "CZK",
    source_url: "https://shop.test/no-history",
    hero_image_url: "/logo.png",
  }]);
  response.sellers[0].history = [];
  return response;
};

for (const price of [0, null]) {
  test(`known product with price ${price} and no history remains visible`, async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      const isProduct = new URL(route.request().url()).pathname === "/api/v1/products/no-history";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(isProduct ? productWithoutHistory(price) : { rows: [] }),
      });
    });

    await page.goto("/deskove-hry/no-history");
    await expect(page.getByRole("heading", { name: "Game without history", exact: true })).toBeVisible();
    await expect(page).toHaveTitle("Game without history | Deskovky levně");
    await expect(page.locator('#nabidky a[target="_blank"]')).toHaveCount(price === null ? 0 : 1);
    await expect(page.locator(".recharts-line")).toHaveCount(0);
    if (price === 0) {
      await expect(page.locator("#nabidky").getByText("0,00 Kč", { exact: true })).toBeVisible();
    }
  });
}
