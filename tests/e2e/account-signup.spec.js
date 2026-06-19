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

test("account signup choices align cleanly on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Account" }).click();

  const parentChoice = page.getByRole("button", { name: "Choose Parent / Child signup" });
  const teacherChoice = page.getByRole("button", { name: "Choose Teacher signup" });
  const parentBox = await parentChoice.boundingBox();
  const teacherBox = await teacherChoice.boundingBox();

  expect(parentBox).not.toBeNull();
  expect(teacherBox).not.toBeNull();
  if (!parentBox || !teacherBox) {
    throw new Error("Signup choices were not visible on mobile.");
  }

  expect(Math.abs(parentBox.x - teacherBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(parentBox.width - teacherBox.width)).toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
  ).toBe(true);
});

test("public deep links open directly and navigation updates the URL", async ({ page }) => {
  await page.goto("/#/donate");

  await expect(page.getByRole("heading", { name: "Help children keep reading practice within reach" })).toBeVisible();
  await expect(page).toHaveURL(/#\/donate$/);

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Support" }).click();

  await expect(page.getByRole("heading", { name: "Support center for families and teachers" })).toBeVisible();
  await expect(page).toHaveURL(/#\/support$/);
});

test("protected deep links prompt sign-in and preserve the requested page", async ({ page }) => {
  await page.goto("/#/teacher");

  await expect(page).toHaveURL(/#\/account\?next=teacher$/);
  await expect(page.getByText("Sign in to continue to the page from your link.")).toBeVisible();
  await expect(page.getByText("Parent / Child signup selected")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign up for the right workspace" })).toBeVisible();
  expect(await page.evaluate(() => window.sessionStorage.getItem("readnest-pending-auth-route-v1"))).toBe("teacher");
});

test("visitor sees distinct donate and support pages", async ({ page }) => {
  await page.goto("/");

  const mainNav = page.getByRole("navigation", { name: "Main navigation" });

  await mainNav.getByRole("button", { name: "Donate" }).click();

  await expect(page.getByRole("heading", { name: "Help children keep reading practice within reach" })).toBeVisible();
  await expect(page.getByText("Where gifts go")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Support center for families and teachers" })).not.toBeVisible();
  await expect(page).toHaveURL(/#\/donate$/);

  await mainNav.getByRole("button", { name: "Support" }).click();

  await expect(page.getByRole("heading", { name: "Support center for families and teachers" })).toBeVisible();
  await expect(page.getByText("Common fixes")).toBeVisible();
  await expect(page.getByRole("region", { name: "Package deals" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Help children keep reading practice within reach" })).not.toBeVisible();
  await expect(page).toHaveURL(/#\/support$/);
});
