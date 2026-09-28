import { expect, type APIRequestContext, type Page } from "@playwright/test";
import path from "node:path";

export const PASSWORD = "password1234";
export const STUDENT = "student@demo.edu";
export const ADMIN = "admin@demo.edu";
export const SAMPLE_PDF = path.join(__dirname, "fixtures", "exam.pdf");
export const SAMPLE_PNG = path.join(__dirname, "fixtures", "solutions.png");

export const errorAlert = "div[role=alert].text-destructive";
export const successStatus = "div[role=status]";

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/(dashboard|verify)/);
}

/** Pulls the latest 6-digit code emailed to `to` from the test mailbox. */
export async function latestCode(request: APIRequestContext, to: string) {
  const res = await request.get(`/api/dev/mailbox?to=${encodeURIComponent(to)}`);
  expect(res.ok()).toBeTruthy();
  const { mails } = (await res.json()) as { mails: { text: string; at: number }[] };
  const last = mails.at(-1);
  expect(last, `no email found for ${to}`).toBeTruthy();
  return last!.text.match(/(\d{6})/)![1];
}

export function unique(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
}

/** Picks an existing entry in a search-or-create picker. */
export async function pick(page: Page, placeholderStart: string, query: string, optionText: string) {
  await page.fill(`input[placeholder^="${placeholderStart}"]`, query);
  await page.click(`li button:has-text("${optionText}")`);
}

export async function attestAndSubmitUpload(page: Page) {
  const checks = page.locator("button[role=checkbox]");
  await checks.nth(1).click();
  await page.click("button[type=submit]:has-text('Upload exam')");
  await page.waitForURL(/\/exams\/[^/]+$/, { timeout: 30_000 });
}
