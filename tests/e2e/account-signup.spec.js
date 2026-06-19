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

test("visitor sees distinct donate and support pages", async ({ page }) => {
  await page.goto("/");

  const mainNav = page.getByRole("navigation", { name: "Main navigation" });

  await mainNav.getByRole("button", { name: "Donate" }).click();

  await expect(page.getByRole("heading", { name: "Help children keep reading practice within reach" })).toBeVisible();
  await expect(page.getByText("Where gifts go")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Support center for families and teachers" })).not.toBeVisible();

  await mainNav.getByRole("button", { name: "Support" }).click();

  await expect(page.getByRole("heading", { name: "Support center for families and teachers" })).toBeVisible();
  await expect(page.getByText("Common fixes")).toBeVisible();
  await expect(page.getByRole("region", { name: "Package deals" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Help children keep reading practice within reach" })).not.toBeVisible();
});
