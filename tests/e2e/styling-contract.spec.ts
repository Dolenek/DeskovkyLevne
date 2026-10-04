import { expect, test } from "playwright/test";
import { mockSearchPageApi } from "./apiMocks";

test("catalog preserves brand colors, card shadows and compact header icons", async ({ page }) => {
  await mockSearchPageApi(page);
  await page.goto("/deskove-hry");
  const card = page.locator('main a[href="/deskove-hry/alpha-game"]');
  await expect(card).toBeVisible();
  await expect(card).toHaveCSS("border-radius", "8px");
  await expect(card).toHaveCSS("border-color", "rgb(223, 231, 241)");
  await expect(card).toHaveCSS("color", "rgb(5, 38, 83)");
  const shadows = await card.evaluate((element) => getComputedStyle(element).boxShadow);
  expect(shadows).toContain("0.05) 0px 1px 2px");
  const header = page.getByRole("banner");
  await expect(header.locator("svg.shrink-0")).toHaveCSS("flex-shrink", "0");
  await expect(header.getByRole("button", { name: "Vyhledat", exact: true }))
    .toHaveCSS("background-color", "rgb(7, 148, 85)");
});

test("search retains invisible outlines and usable focus in forced colors", async ({ page }) => {
  await mockSearchPageApi(page);
  await page.goto("/deskove-hry");
  const input = page.getByRole("banner").getByRole("textbox");
  expect(await input.evaluate((element) => {
    const style = getComputedStyle(element);
    return style.outlineStyle === "none" || style.outlineColor === "rgba(0, 0, 0, 0)";
  })).toBe(true);
  await page.emulateMedia({ forcedColors: "active" });
  await input.focus();
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS("outline-style", "solid");
  await expect(input).toHaveCSS("outline-width", "2px");
  await expect(input).toHaveCSS("outline-offset", "2px");
});
