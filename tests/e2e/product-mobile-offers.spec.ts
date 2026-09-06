import { expect, test } from "playwright/test";
import { productDetailResponseFromRows } from "./apiMocks";

const rows = Array.from({ length: 10 }, (_, index) => ({
  product_name_normalized: "many-offers",
  product_name_original: "Many Offers",
  seller: `shop-${index}`,
  product_code: `offer-${index}`,
  latest_price: index === 0 ? 1 : 100 + index,
  currency_code: "CZK",
  availability_label: index === 0 ? "Out of stock" : "Skladem",
  latest_scraped_at: "2026-09-01",
  source_url: `https://shop.test/offer-${index}`,
  hero_image_url: "/logo.png",
  supplementary_parameters: [
    { name: "Minimální počet hráčů", value: "2" },
    { name: "Maximální počet hráčů", value: "4" },
    { name: "Jazyk hry", value: "český" },
  ],
}));

const response = productDetailResponseFromRows(rows);
response.sellers.forEach((seller) => {
  seller.history = [
    {
      price_date: "2026-08-01",
      price_with_vat: seller.latest_price,
      currency_code: "CZK",
      list_price_with_vat: null,
      scraped_at: "2026-08-01",
      snapshot_count: 1,
    },
    {
      price_date: "2026-09-01",
      price_with_vat: seller.latest_price,
      currency_code: "CZK",
      list_price_with_vat: null,
      scraped_at: "2026-09-01",
      snapshot_count: 1,
    },
  ];
});

test("mobile detail prioritizes available offers and fits all seller histories", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(response) }),
  );
  await page.goto("/deskove-hry/many-offers");
  const title = page.getByRole("heading", { name: "Many Offers", exact: true });
  await expect(title).toBeVisible();
  const cta = page.getByRole("link", { name: "Zobrazit nabídky" });
  expect((await cta.boundingBox())!.y).toBeLessThan(700);
  await expect(page.getByText("Nejlevnější skladem", { exact: true }).first().locator("..")).toContainText(
    "101",
  );
  const offers = page.locator('#nabidky a[target="_blank"]');
  await expect(offers).toHaveCount(8);
  await expect(offers.first()).toHaveAttribute("href", "https://shop.test/offer-1");
  await page.getByRole("button", { name: "Zobrazit všechny nabídky (10)" }).click();
  await expect(offers).toHaveCount(10);
  await expect(offers.last()).toHaveAttribute("href", "https://shop.test/offer-0");
  await expect(page.locator(".recharts-line")).toHaveCount(10);
  const chart = page.locator(".recharts-responsive-container");
  expect((await chart.boundingBox())!.width).toBeLessThan(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Skrýt shop-9", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Skrýt shop-9", exact: true }).click();
  await expect(page.locator(".recharts-line")).toHaveCount(9);
});
