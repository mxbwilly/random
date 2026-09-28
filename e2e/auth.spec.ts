import { expect, test } from "@playwright/test";
import { ADMIN, PASSWORD, STUDENT, errorAlert, latestCode, login, unique } from "./helpers";

test("signup with a school email, verify with the emailed code, log out", async ({ page, request }) => {
  const email = `${unique("e2e")}@cs.demo.edu`;
  await page.goto("/signup");
  await page.fill("#email", email);
  await page.fill("#displayName", "E2E Student");
  await page.fill("#password", "correct-horse-battery");
  await page.click("#acceptTerms");
  await page.click("button[type=submit]");
  await page.waitForURL(/\/verify/);

  await page.fill("#code", "000000");
  await page.click("button[type=submit]");
  await expect(page.locator(errorAlert)).toContainText("isn't right");

  await page.fill("#code", await latestCode(request, email));
  await page.click("button[type=submit]");
  await page.waitForURL(/\/dashboard/);
  await expect(page.locator("h1")).toContainText("Welcome, E2E");

  await page.click('button[aria-label="Account menu"]');
  await page.click("text=Log out");
  await page.waitForURL(/\/login/);
});

test("rejects non-school emails and wrong passwords, keeps the typed email", async ({ page }) => {
  await page.goto("/signup");
  await page.fill("#email", "someone@gmail.com");
  await page.fill("#displayName", "Nope");
  await page.fill("#password", "correct-horse-battery");
  await page.click("#acceptTerms");
  await page.click("button[type=submit]");
  await expect(page.locator(errorAlert)).toContainText("don't recognize @gmail.com");

  await page.goto("/login");
  await page.fill("#email", STUDENT);
  await page.fill("#password", "wrong-password");
  await page.click("button[type=submit]");
  await expect(page.locator(errorAlert)).toContainText("Incorrect email or password");
  await expect(page.locator("#email")).toHaveValue(STUDENT);
});

test("password reset via emailed code", async ({ page, request }) => {
  await page.goto("/forgot-password");
  await page.fill("#email", ADMIN);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/reset-password/);
  await page.fill("#code", await latestCode(request, ADMIN));
  await page.fill("#password", PASSWORD); // reset to the same password so other tests keep working
  await page.click("button[type=submit]");
  await page.waitForURL(/\/dashboard/);
});

test("logged-out visitors are redirected away from app pages", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL(/\/login\?next=/);
  await login(page, STUDENT);
  await expect(page).toHaveURL(/\/dashboard/);
});
