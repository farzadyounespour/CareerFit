import { expect, test } from "@playwright/test";


test("home page opens the resume workflow and account dialog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find jobs that fit your experience." })).toBeVisible();
  await page.getByRole("button", { name: "Check your resume fit" }).click();
  await expect(page.getByRole("heading", { name: "Tell us what kind of work fits you" })).toBeVisible();
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByRole("dialog", { name: "CareerFit account" })).toBeVisible();
});

test("mobile navigation remains horizontally usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Jobs", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Jobs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose the role you want to evaluate" })).toBeVisible();
});
