import { expect, test } from "playwright/test";
import { mockSearchResults } from "./searchResultsMocks";

test("URL restores selection, sorting, pagination and scroll after visiting a product", async ({ page }) => {
  const requests = await mockSearchResults(page);
  await page.goto("/deskove-hry?q=hra&categories=strategicka&page=6&sort=price_asc");
  await expect(page.getByRole("button", { name: "Stránka 6", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("combobox", { name: "Řazení" })).toHaveValue("price_asc");
  await expect.poll(() => requests.at(-1)?.searchParams.get("offset")).toBe("50");
  await expect.poll(() => requests.at(-1)?.searchParams.get("sort")).toBe("price_asc");
  const card = page.locator('main a[href="/deskove-hry/ceska-hra-60"]');
  await card.scrollIntoViewIfNeeded();
  const previousScroll = await page.evaluate(() => window.scrollY);
  await card.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Česká hra 01");
  await page.goBack();
  await expect(page.getByRole("button", { name: "Stránka 6", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(previousScroll).toBeGreaterThan(100);
  await expect
    .poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - previousScroll))
    .toBeLessThan(30);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Řazení" })).toHaveValue("price_asc");
  await page.getByRole("button", { name: "Odebrat filtr Strategická" }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.has("categories")).toBe(false);
  await expect.poll(() => requests.at(-1)?.searchParams.get("offset")).toBe("0");
  expect(new URL(page.url()).searchParams.get("sort")).toBe("price_asc");
});

test("mobile catalog has one search and a keyboard-accessible filter drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSearchResults(page);
  await page.goto("/deskove-hry");
  await expect(page.getByRole("textbox")).toHaveCount(1);
  await expect(page.getByRole("banner").getByRole("link", { name: "Katalog" })).toBeVisible();
  const filters = page.getByRole("button", { name: "Filtry (0)" });
  await filters.click();
  const dialog = page.getByRole("dialog", { name: "Filtry", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Zobrazit výsledky (75)" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(filters).toBeFocused();
  await page.getByRole("combobox", { name: "Jazyk" }).selectOption("en");
  await expect(page.getByRole("combobox", { name: "Sort by" })).toBeVisible();
});
