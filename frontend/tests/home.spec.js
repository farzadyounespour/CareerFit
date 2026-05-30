import { expect, test } from "@playwright/test";


test("protected resume workflow prompts guests to sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find jobs that fit your experience." })).toBeVisible();
  await page.getByRole("button", { name: "Check your resume fit" }).click();
  await expect(page.getByRole("dialog", { name: "CareerFit account" })).toBeVisible();
});

test("mobile navigation remains horizontally usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Jobs", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Jobs", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "CareerFit account" })).toBeVisible();
});

test("dark mode persists across reloads", async ({ page }) => {
  await page.goto("/");
  await page.getByTitle("Use dark mode").click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByTitle("Use light mode")).toBeVisible();
});
