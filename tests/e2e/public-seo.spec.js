import { expect, test } from "@playwright/test";

const seoPages = [
  ["reading-practice", "Personalized reading practice for kids"],
  ["online-reading-games", "Online reading games that feel like play"],
  ["kindergarten-reading", "Kindergarten reading practice that starts gently"],
  ["first-grade-reading", "First grade reading practice for growing confidence"],
  ["second-grade-reading", "Second grade reading practice for fluency and meaning"],
  ["phonics-practice", "Phonics practice that helps sounds click"],
  ["sight-words", "Sight word practice kids can repeat"],
  ["memory-games", "Memory games that support early reading habits"],
  ["teacher-dashboard", "Teacher reading dashboard for assigned students"],
  ["reading-intervention", "Reading intervention support that stays practical"],
  ["caregiver-progress", "Parent-friendly reading progress tracking"],
  ["pricing", "ReadNest pricing"],
  ["kid-safe", "A kid-safe reading app that families can actually trust"],
  ["vs", "ReadNest compared to other early reading apps"],
  ["vs/abcmouse", "ReadNest vs ABCmouse: an honest comparison for K-2 reading"],
  ["vs/reading-eggs", "ReadNest vs Reading Eggs: an honest K-2 comparison"],
  ["vs/homer", "ReadNest vs Homer: an honest K-2 comparison"],
  ["vs/hooked-on-phonics", "ReadNest vs Hooked on Phonics: an honest K-2 comparison"],
  ["for-tutors", "ReadNest for tutors and small groups"],
  ["my-child-cant-read-yet", "My child can't read yet — when to worry and what helps"],
  ["science-of-reading", "Is ReadNest based on the science of reading?"]
];

test.describe("crawlable SEO landing pages", () => {
  for (const [slug, heading] of seoPages) {
    test(`${slug} exposes branded content, canonical URL, and JSON-LD`, async ({ page }) => {
      await page.goto(`/${slug}/index.html`);

      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByRole("link", { name: "ReadNest" })).toBeVisible();
      await expect(page.getByRole("link", { name: "See plans" })).toBeVisible();

      const seoState = await page.evaluate(() => ({
        canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href"),
        robots: document.querySelector("meta[name='robots']")?.getAttribute("content"),
        jsonLdCount: document.querySelectorAll("script[type='application/ld+json']").length,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      }));

      expect(seoState.canonical).toBe(`https://myreadnest.org/${slug}/`);
      expect(seoState.robots).toContain("index");
      expect(seoState.jsonLdCount).toBeGreaterThan(0);
      expect(seoState.horizontalOverflow).toBe(false);
    });
  }

  test("sitemap and robots expose production crawl paths", async ({ page }) => {
    const sitemapResponse = await page.goto("/sitemap.xml");
    expect(sitemapResponse?.ok()).toBe(true);
    await expect(page.locator("body")).toContainText("https://myreadnest.org/reading-practice/");
    await expect(page.locator("body")).toContainText("https://myreadnest.org/kid-safe/");
    await expect(page.locator("body")).toContainText("https://myreadnest.org/vs/abcmouse/");
    await expect(page.locator("body")).toContainText("https://myreadnest.org/for-tutors/");
    await expect(page.locator("body")).toContainText("2026-07-05");

    const robotsResponse = await page.goto("/robots.txt");
    expect(robotsResponse?.ok()).toBe(true);
    await expect(page.locator("body")).toContainText("Sitemap: https://myreadnest.org/sitemap.xml");
  });
});
