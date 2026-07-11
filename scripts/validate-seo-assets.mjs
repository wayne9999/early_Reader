import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(root, "public");
const expectedUrls = [
  "https://myreadnest.org/",
  "https://myreadnest.org/reading-practice/",
  "https://myreadnest.org/online-reading-games/",
  "https://myreadnest.org/kindergarten-reading/",
  "https://myreadnest.org/first-grade-reading/",
  "https://myreadnest.org/second-grade-reading/",
  "https://myreadnest.org/phonics-practice/",
  "https://myreadnest.org/sight-words/",
  "https://myreadnest.org/memory-games/",
  "https://myreadnest.org/teacher-dashboard/",
  "https://myreadnest.org/reading-intervention/",
  "https://myreadnest.org/caregiver-progress/",
  "https://myreadnest.org/pricing/",
  "https://myreadnest.org/kid-safe/",
  "https://myreadnest.org/vs/",
  "https://myreadnest.org/vs/abcmouse/",
  "https://myreadnest.org/vs/reading-eggs/",
  "https://myreadnest.org/vs/homer/",
  "https://myreadnest.org/vs/hooked-on-phonics/",
  "https://myreadnest.org/for-tutors/",
  "https://myreadnest.org/my-child-cant-read-yet/",
  "https://myreadnest.org/science-of-reading/"
];

const errors = [];
const sitemap = await readFile(join(publicDir, "sitemap.xml"), "utf8");
const robots = await readFile(join(publicDir, "robots.txt"), "utf8");

for (const url of expectedUrls) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) {
    errors.push(`Sitemap is missing ${url}`);
  }
}

if (!robots.includes("Sitemap: https://myreadnest.org/sitemap.xml")) {
  errors.push("robots.txt must point to the production sitemap.");
}

for (const url of expectedUrls.filter((url) => url !== "https://myreadnest.org/")) {
  const slug = url.replace("https://myreadnest.org/", "").replace(/\/$/, "");
  const html = await readFile(join(publicDir, slug, "index.html"), "utf8");
  const requiredSnippets = [
    `<link rel="canonical" href="${url}"`,
    '<meta name="robots" content="index, follow',
    'type="application/ld+json"',
    'ReadNest',
    'href="/#/support"'
  ];

  for (const snippet of requiredSnippets) {
    if (!html.includes(snippet)) {
      errors.push(`${slug}/index.html is missing ${snippet}`);
    }
  }
}

if (errors.length) {
  console.error(`SEO asset validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`Validated ${expectedUrls.length} crawlable SEO URLs.`);
