import { expect, test } from "playwright/test";

test("unknown routes render explicit not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByText(/Page not found|Stránka nenalezena/)).toBeVisible();
  await expect(page.getByRole("button")).toBeVisible();
});
