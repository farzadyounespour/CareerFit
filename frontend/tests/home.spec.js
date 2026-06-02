import { expect, test } from "@playwright/test";


test("protected resume workflow prompts guests to sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Prepare a stronger application for every role." })).toBeVisible();
  await page.getByRole("button", { name: "Check your resume fit" }).click();
  await expect(page.getByRole("dialog", { name: "CareerFit account" })).toBeVisible();
});

test("desktop navigation keeps job discovery accessible", async ({ page }) => {
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
