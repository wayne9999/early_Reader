import { expect, test } from "@playwright/test";

test("visitor can distinguish guest state and choose a teacher signup path", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Browsing as guest")).toBeVisible();
  await page.getByRole("button", { name: "Account" }).click();

  await expect(page.getByRole("heading", { name: "Sign up for the right workspace" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose Parent / Child signup" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose Teacher signup" })).toBeVisible();

  await page.getByRole("button", { name: "Choose Teacher signup" }).click();

  await expect(page.getByText("Teacher signup selected")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Teacher account" })).toBeVisible();
});
