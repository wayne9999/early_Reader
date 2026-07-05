import { expect, test } from "@playwright/test";

const protectedActivities = [
  ["rhymes", "rhymes"],
  ["sound-sort", "sound-sort"],
  ["sentence-builder", "sentence-builder"],
  ["story-order", "story-order"],
  ["word-meaning", "word-meaning"],
  ["echo-reader", "echo-reader"],
  ["voice-quest", "voice-quest"]
];

test.describe("public activity experience", () => {
  test("guest can complete a short reading flow", async ({ page }) => {
    await page.goto("/#/reading");

    await expect(page.getByRole("heading", { name: "Practice short sounds, words, and sentences" })).toBeVisible();
    await expect(page.getByText("The cat can nap.")).toBeVisible();

    await page.getByRole("button", { name: "Next word" }).click();
    await expect(page.getByText("I see the sun.")).toBeVisible();

    await page.getByRole("button", { name: "Complete reading" }).click();
    await expect(page.getByText("1 of 3 complete")).toBeVisible();
  });

  test("guest can interact with the memory board without layout overflow", async ({ page }) => {
    await page.goto("/#/memory");

    await expect(page.getByRole("heading", { name: "Memory cards with school-ready ideas" })).toBeVisible();
    await page.getByRole("button", { name: "New game" }).click();
    await page.getByRole("button", { name: "Hidden memory card" }).nth(0).click();
    await page.getByRole("button", { name: "Hidden memory card" }).nth(0).click();

    await expect(page.getByText("1 turn taken")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  for (const [route, pendingRoute] of protectedActivities) {
    test(`guest deep link to ${route} asks for account and preserves destination`, async ({ page }) => {
      await page.goto(`/#/${route}`);

      await expect(page).toHaveURL(new RegExp(`#\\/account\\?next=${pendingRoute}$`));
      await expect(page.getByText("Sign in to continue to the page from your link.")).toBeVisible();
    });
  }
});
