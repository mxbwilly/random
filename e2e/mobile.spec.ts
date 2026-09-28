import { expect, test } from "@playwright/test";
import { ADMIN, login } from "./helpers";

const PAGES = ["/dashboard", "/search?q=anderson", "/upload", "/requests?filter=all", "/requests/new", "/notifications", "/settings", "/admin/reports", "/admin/catalog", "/admin/schools"];

test("no horizontal overflow on a phone, and the menu works", async ({ page }) => {
  await login(page, ADMIN);
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, `${path} overflows`).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await expect(page.locator("header nav a:has-text('Requests')")).toBeHidden();
  await page.click("button[aria-label='Open menu']");
  await page.locator("[role=dialog] a:has-text('Upload')").click();
  await expect(page).toHaveURL(/\/upload/);
});
