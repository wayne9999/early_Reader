// Local equivalent of the Google Rich Results Test for the generated SEO
// pages: parses every JSON-LD block and validates the FAQPage and
// BreadcrumbList payloads against Google's documented requirements, plus the
// canonical/Open Graph consistency checks URL Inspection surfaces.
// Run: node scripts/validate-rich-results.mjs

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(root, "public");
const siteUrl = "https://myreadnest.org";

const errors = [];
const warnings = [];

function extractJsonLdBlocks(html, pageName) {
  const blocks = [];
  const scriptPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;

  while ((match = scriptPattern.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].replaceAll("<\\/script", "</script"));
      blocks.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch (error) {
      errors.push(`${pageName}: JSON-LD block does not parse (${error.message}). Rich Results Test would fail outright.`);
    }
  }

  return blocks;
}

function validateFaqPage(faq, pageName) {
  const questions = Array.isArray(faq.mainEntity) ? faq.mainEntity : [];

  if (questions.length === 0) {
    errors.push(`${pageName}: FAQPage has no mainEntity questions.`);
    return;
  }

  questions.forEach((question, index) => {
    if (question["@type"] !== "Question") {
      errors.push(`${pageName}: FAQ entity ${index} must have @type Question.`);
    }

    if (typeof question.name !== "string" || question.name.trim().length < 3) {
      errors.push(`${pageName}: FAQ question ${index} needs a non-empty name.`);
    }

    const answer = question.acceptedAnswer;

    if (!answer || answer["@type"] !== "Answer" || typeof answer.text !== "string" || answer.text.trim().length < 3) {
      errors.push(`${pageName}: FAQ question ${index} needs acceptedAnswer.text.`);
    }
  });
}

function validateBreadcrumbs(breadcrumbs, pageName, canonical) {
  const items = Array.isArray(breadcrumbs.itemListElement) ? breadcrumbs.itemListElement : [];

  if (items.length === 0) {
    errors.push(`${pageName}: BreadcrumbList has no itemListElement.`);
    return;
  }

  items.forEach((item, index) => {
    if (item["@type"] !== "ListItem") {
      errors.push(`${pageName}: breadcrumb ${index} must be a ListItem.`);
    }

    if (item.position !== index + 1) {
      errors.push(`${pageName}: breadcrumb positions must be sequential starting at 1.`);
    }

    if (typeof item.name !== "string" || !item.name.trim()) {
      errors.push(`${pageName}: breadcrumb ${index} needs a name.`);
    }

    if (typeof item.item !== "string" || !item.item.startsWith(siteUrl)) {
      errors.push(`${pageName}: breadcrumb ${index} item must be an absolute ${siteUrl} URL.`);
    }
  });

  const lastItem = items[items.length - 1];

  if (canonical && lastItem && lastItem.item !== canonical) {
    errors.push(`${pageName}: final breadcrumb (${lastItem.item}) should match the canonical URL (${canonical}).`);
  }
}

function attribute(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1] : null;
}

function validatePage(html, pageName, expectedCanonical) {
  const canonical = attribute(html, /<link rel="canonical" href="([^"]+)"/);

  if (canonical !== expectedCanonical) {
    errors.push(`${pageName}: canonical is ${canonical ?? "missing"}, expected ${expectedCanonical}.`);
  }

  const robotsMeta = attribute(html, /<meta name="robots" content="([^"]+)"/);

  if (!robotsMeta || !robotsMeta.includes("index")) {
    errors.push(`${pageName}: robots meta must allow indexing (found: ${robotsMeta ?? "missing"}).`);
  }

  if (robotsMeta && robotsMeta.includes("noindex")) {
    errors.push(`${pageName}: page is marked noindex.`);
  }

  const ogUrl = attribute(html, /<meta property="og:url" content="([^"]+)"/);

  if (ogUrl && ogUrl !== expectedCanonical) {
    errors.push(`${pageName}: og:url (${ogUrl}) disagrees with canonical (${expectedCanonical}).`);
  }

  const description = attribute(html, /<meta name="description" content="([^"]+)"/);

  if (!description) {
    errors.push(`${pageName}: missing meta description.`);
  } else if (description.length < 50 || description.length > 170) {
    warnings.push(`${pageName}: meta description is ${description.length} chars; 50-170 reads best in snippets.`);
  }

  if (!/<title>[^<]{5,}<\/title>/.test(html)) {
    errors.push(`${pageName}: missing or empty <title>.`);
  }

  const blocks = extractJsonLdBlocks(html, pageName);
  const faqBlocks = blocks.filter((block) => block["@type"] === "FAQPage");
  const breadcrumbBlocks = blocks.filter((block) => block["@type"] === "BreadcrumbList");

  faqBlocks.forEach((block) => validateFaqPage(block, pageName));
  breadcrumbBlocks.forEach((block) => validateBreadcrumbs(block, pageName, expectedCanonical));

  return { faqCount: faqBlocks.length, breadcrumbCount: breadcrumbBlocks.length };
}

const sitemap = await readFile(join(publicDir, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const uniqueLocs = new Set(locs);

if (uniqueLocs.size !== locs.length) {
  errors.push("sitemap.xml contains duplicate <loc> entries.");
}

for (const lastmod of [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1])) {
  if (Number.isNaN(Date.parse(lastmod))) {
    errors.push(`sitemap.xml has invalid lastmod: ${lastmod}`);
  }
}

for (const loc of locs) {
  if (!loc.startsWith(`${siteUrl}/`)) {
    errors.push(`sitemap loc ${loc} is not on ${siteUrl}.`);
    continue;
  }

  const slug = loc.replace(`${siteUrl}/`, "").replace(/\/$/, "");
  const filePath = slug ? join(publicDir, slug, "index.html") : join(root, "index.html");

  if (!existsSync(filePath)) {
    errors.push(`sitemap lists ${loc} but ${filePath.replace(`${root}/`, "")} does not exist.`);
  }
}

let pagesChecked = 0;
let faqTotal = 0;
let breadcrumbTotal = 0;

for (const entry of await readdir(publicDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const pagePath = join(publicDir, entry.name, "index.html");

  if (!existsSync(pagePath)) {
    continue;
  }

  const html = await readFile(pagePath, "utf8");
  const expectedCanonical = `${siteUrl}/${entry.name}/`;
  const counts = validatePage(html, `${entry.name}/index.html`, expectedCanonical);

  if (!uniqueLocs.has(expectedCanonical)) {
    errors.push(`${entry.name}/index.html exists but ${expectedCanonical} is missing from sitemap.xml.`);
  }

  pagesChecked += 1;
  faqTotal += counts.faqCount;
  breadcrumbTotal += counts.breadcrumbCount;
}

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`);
}

if (errors.length) {
  console.error(`Rich results validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `Rich results validation passed: ${pagesChecked} pages, ${faqTotal} FAQPage blocks, ${breadcrumbTotal} BreadcrumbList blocks, ${locs.length} sitemap URLs.`
);
