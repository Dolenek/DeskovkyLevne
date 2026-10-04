import { expect, test } from "playwright/test";
import { baseCatalogRow, mockSearchPageApi, productDetailResponseFromRows } from "./apiMocks";

const scenarios = [
  { name: "catalog", path: "/deskove-hry", endpoint: "/api/v1/catalog" },
  { name: "landing", path: "/", endpoint: "/api/v1/catalog" },
  { name: "detail", path: "/deskove-hry/alpha-game", endpoint: "/api/v1/products/alpha-game" },
  { name: "suggestions", path: "/deskove-hry", endpoint: "/api/v1/search/suggest" },
];

for (const failure of ["network", "server"] as const) {
  for (const scenario of scenarios) {
    test(`${scenario.name} exposes retry without invented offers after ${failure} failure`, async ({ page }) => {
      let unavailable = true;
      await mockSearchPageApi(page);
      await page.route(`**${scenario.endpoint}*`, async (route) => {
        if (unavailable) {
          if (failure === "network") await route.abort("failed");
          else await route.fulfill({ status: 503, body: '{"error":"unavailable"}' });
          return;
        }
        const body = scenario.name === "detail"
          ? productDetailResponseFromRows([baseCatalogRow])
          : { rows: [baseCatalogRow], total: 1, total_estimate: 1 };
        await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
      });
      await page.goto(scenario.path);
      if (scenario.name === "suggestions") await page.getByRole("banner").getByRole("textbox").fill("alpha");
      await expect(page.getByText("Něco se pokazilo", { exact: true })).toBeVisible();
      await expect(page.getByText("Ukázková hra cenové historie")).toHaveCount(0);
      if (scenario.name === "detail") {
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
        await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
      }
      unavailable = false;
      await page.getByRole("button", { name: "Zkusit znovu", exact: true }).click();
      await expect(page.getByText("Něco se pokazilo", { exact: true })).toHaveCount(0);
      await expect(page.getByText("Alpha Game", { exact: true }).first()).toBeVisible();
    });
  }
}
