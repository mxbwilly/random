import { expect, test } from "@playwright/test";
import { ADMIN, SAMPLE_PDF, STUDENT, attestAndSubmitUpload, login, pick, successStatus } from "./helpers";

test("request -> reply -> notification -> fulfil by upload -> comments -> report -> hide/restore", async ({ browser }) => {
  const student = await (await browser.newContext()).newPage();
  const admin = await (await browser.newContext()).newPage();
  await login(student, STUDENT);
  await login(admin, ADMIN);

  // Student posts a request.
  await student.goto("/requests/new");
  await pick(student, "Course code", "cs 10", "CS 101");
  await pick(student, "Teacher", "anders", "Alice Anderson");
  await student.fill("#message", "Does anyone have the 2019 or 2020 finals? Taking it this fall.");
  await student.click("button[type=submit]");
  await student.waitForURL((u) => /\/requests\/(?!new)[^/]+$/.test(u.pathname));
  const requestUrl = student.url();
  await expect(student.locator("h1")).toHaveText("CS 101 · Alice Anderson");

  // Admin replies; student sees a notification without reloading.
  await admin.goto(requestUrl);
  await admin.fill("textarea[name=body]", "I have the Fall 2019 final, uploading now.");
  await admin.click("button:has-text('Reply')");
  await expect(admin.locator("li", { hasText: "uploading now" })).toBeVisible();
  await student.goto("/dashboard");
  await expect(student.locator('a[href="/notifications"]')).toHaveAttribute("aria-label", /unread/);
  await student.goto("/notifications");
  await expect(student.locator("ul li").first()).toContainText("replied to your exam request");

  // Admin fulfils it with an upload.
  await admin.click("a:has-text('I have it')");
  await admin.waitForURL(/\/upload\?requestId=/);
  await admin.setInputFiles("#examFiles", SAMPLE_PDF);
  await attestAndSubmitUpload(admin);
  const examUrl = admin.url();
  await student.goto(requestUrl);
  await expect(student.locator("text=Fulfilled by")).toBeVisible();

  // Comment thread with a reply.
  await student.goto(examUrl);
  await student.fill("#comments textarea[name=body]", "Was this the actual final?");
  await student.click("#comments button:has-text('Comment')");
  await expect(student.locator("#comments li", { hasText: "actual final" })).toBeVisible();
  await admin.reload();
  await admin.click("#comments button:has-text('Reply')");
  await admin.locator("#comments form textarea[name=body]").nth(1).fill("Yes, from my section.");
  await admin.locator("#comments form").nth(1).locator("button:has-text('Reply')").click();
  await expect(admin.locator("#comments li", { hasText: "from my section" })).toBeVisible();

  // Report, hide, restore.
  await student.goto(`${examUrl}/report`);
  await student.check("input[value=WRONG_INFO]");
  await student.click("button:has-text('Send report')");
  await expect(student.locator(successStatus)).toContainText("admin will review");
  const examId = examUrl.split("/exams/")[1];
  await admin.goto("/admin/reports");
  const card = admin.locator("section div.rounded-md", { has: admin.locator(`a[href="/exams/${examId}"]`) });
  await expect(card).toHaveCount(1);
  await card.locator("button:has-text('Hide exam')").click();
  await expect(card).toHaveCount(0);
  // Pages stream (loading.tsx), so the status is 200; the body must be the not-found page.
  await student.goto(examUrl);
  await expect(student.locator("h1")).toHaveText("Not here");
  const hiddenRow = admin.locator("li", { has: admin.locator(`a[href="/exams/${examId}"]`) });
  await hiddenRow.locator("button:has-text('Restore')").click();
  await expect(hiddenRow).toHaveCount(0);
  await student.goto(examUrl);
  await expect(student.locator("h1")).not.toHaveText("Not here");

  // Students can't reach admin pages.
  await student.goto("/admin/reports");
  await expect(student).toHaveURL(/\/dashboard/);
});

test("students from another school see nothing from Demo University", async ({ page }) => {
  // pat@other.edu is created by the seed for exactly this check.
  await login(page, "pat@other.edu");
  await expect(page.locator("a[href] .text-3xl").first()).toHaveText("0");
  await page.goto("/search?q=anderson");
  await expect(page.locator("section", { hasText: "Teachers" })).toContainText("No teachers match");
});

