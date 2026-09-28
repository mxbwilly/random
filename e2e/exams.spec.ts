import { expect, test } from "@playwright/test";
import { SAMPLE_PDF, SAMPLE_PNG, STUDENT, attestAndSubmitUpload, errorAlert, login, pick, unique } from "./helpers";

test.beforeEach(async ({ page }) => login(page, STUDENT));

test("search finds seeded teachers and courses; pages group exams", async ({ page }) => {
  await page.goto("/search?q=anders");
  await expect(page.locator("section", { hasText: "Teachers" }).locator("li")).toContainText(["Alice Anderson"]);
  await page.goto("/search?q=cs101");
  await page.locator("section", { hasText: "Courses" }).locator("li a", { hasText: "CS 101" }).click();
  await page.waitForURL(/\/courses\//);
  await expect(page.locator("h1")).toHaveText("CS 101");
  await expect(page.locator("main section h2").first()).toContainText("Alice Anderson");
  await page.locator("main section h2 a").first().click();
  await page.waitForURL(/\/teachers\//);
  await expect(page.locator("main section h2").first()).toContainText("CS 101");
});

test("upload an exam with solutions for a new teacher, preview and download it", async ({ page, context }) => {
  const teacher = unique("Prof Test ");
  await page.goto("/upload");
  await pick(page, "Course code", "cs 24", "CS 240");
  await page.fill("input[placeholder=\"Teacher's name\"]", teacher);
  await page.click("li button:has-text('Add new teacher')");
  await page.setInputFiles("#examFiles", SAMPLE_PDF);
  await page.setInputFiles("#solutionFiles", SAMPLE_PNG);
  await page.fill("#title", "E2E upload");
  await attestAndSubmitUpload(page);

  await expect(page.locator("h1")).toContainText("E2E upload");
  await expect(page.locator("aside")).toContainText("exam.pdf");
  await expect(page.locator("aside")).toContainText("solutions.png");
  const iframeSrc = (await page.getAttribute("iframe", "src"))!;
  const preview = await context.request.get(iframeSrc.split("#")[0]);
  expect(preview.status()).toBe(200);
  expect(preview.headers()["content-type"]).toBe("application/pdf");
  const fileId = iframeSrc.match(/files\/([^#?]+)/)![1];
  const download = await context.request.get(`/api/files/${fileId}?dl=1`);
  expect(download.headers()["content-disposition"]).toContain("attachment");

  await page.click('button[aria-label="Helpful"]');
  await expect(page.locator("div[title] span")).toHaveText("1");

  // Logged-out access to the file is blocked.
  const anon = await page.context().browser()!.newContext();
  expect((await anon.request.get(`/api/files/${fileId}`)).status()).toBe(401);
  await anon.close();
});

test("rejects files that aren't PDFs or images", async ({ page }) => {
  await page.goto("/upload");
  await pick(page, "Course code", "cs 10", "CS 101");
  await pick(page, "Teacher", "anders", "Alice Anderson");
  await page.setInputFiles("#examFiles", { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await page.locator("button[role=checkbox]").nth(1).click();
  await page.click("button[type=submit]:has-text('Upload exam')");
  await expect(page.locator(errorAlert)).toContainText("isn't a PDF or image");
});
