# ReadNest Growth And SEO Plan

ReadNest should win trust before it asks families or teachers to pay. The growth strategy is to make the app easy to try, easy to understand, and easy for search engines to classify.

## Primary Audiences

- Parents and caregivers looking for short reading practice for kindergarten through grade 2.
- Teachers and tutors looking for student reading progress, intervention planning, and report support.
- Donors who want to support accessible reading practice for children.

## Search Intent Map

| Intent | Target page | Notes |
| --- | --- | --- |
| General reading app | `/` | Main app entry with SoftwareApplication and FAQ structured data. |
| Online reading games | `/online-reading-games/` | Captures broad parent searches for fun reading games. |
| Kindergarten reading | `/kindergarten-reading/` | Age/grade-specific parent search. |
| First grade reading | `/first-grade-reading/` | Grade-specific reading practice search. |
| Second grade reading | `/second-grade-reading/` | Higher early-reader fluency and vocabulary search. |
| Sight words | `/sight-words/` | High-intent early literacy query. |
| Phonics practice | `/phonics-practice/` | High-intent decoding and sound blending query. |
| Memory games | `/memory-games/` | Educational game and working-memory query. |
| Parent progress tracking | `/caregiver-progress/` | Caregiver progress and home practice query. |
| Teacher dashboard | `/teacher-dashboard/` | Teacher SaaS/productivity query. |
| Reading intervention | `/reading-intervention/` | Tutor/teacher intervention support query. |
| Pricing | `/pricing/` | Commercial intent for Free, Family Plus, and Teacher Pro. |
| Kid safety and privacy | `/kid-safe/` | Trust anchor for parents; ads, COPPA, screen time, data. Closes the sale from every other page. |
| Comparison hub | `/vs/` | Head-to-head competitor comparisons hub. |
| ReadNest vs ABCmouse | `/vs/abcmouse/` | High commercial-intent comparison. |
| ReadNest vs Reading Eggs | `/vs/reading-eggs/` | High commercial-intent comparison. |
| For tutors | `/for-tutors/` | Teacher Pro landing for tutors and small-group specialists (highest-LTV segment). |
| Symptom-first for parents | `/my-child-cant-read-yet/` | Top-of-funnel pull for anxious-parent search intent. |

## Launch Actions

1. Keep the production deploy and search submission workflows green.
2. Share the homepage and `/online-reading-games/` with parent groups, tutoring communities, teacher communities, and local school-adjacent groups.
3. Add real screenshots, short demo videos, and testimonials once families and teachers have tested the app.
4. Publish helpful parent/teacher articles that answer one specific reading-practice question at a time.
5. Track Search Console queries weekly and turn high-impression/low-click searches into better page titles, FAQs, and content.
6. Use small-budget paid campaigns only after analytics confirm signup, checkout, and support flows are converting.

## July 2026 Crawlability Pass

Completed:

- Added generated static landing pages for the highest-intent parent and teacher search paths.
- Added production canonical URLs for `https://myreadnest.org`.
- Added Open Graph, Twitter preview metadata, JSON-LD, and FAQ structured data on each static page.
- Added `scripts/generate-seo-pages.mjs` so the pages are rebuilt before every production build.
- Added `scripts/validate-seo-assets.mjs` and e2e coverage for sitemap, robots, canonical tags, JSON-LD, and mobile overflow.

Completed launch automation:

1. `Submit To Search Engines` now submits public URLs to IndexNow for Bing, Yandex, and partners.
2. `GSC_SERVICE_ACCOUNT_JSON` is configured for GitHub Actions.
3. Google Search Console API is enabled for the `readnest-f9c67` Google Cloud project.
4. The workflow successfully submits `https://myreadnest.org/sitemap.xml` to Google Search Console.
5. The workflow successfully runs URL Inspection for `/`, `/reading-practice/`, `/online-reading-games/`, `/kindergarten-reading/`, `/teacher-dashboard/`, and the new landing pages listed below.
6. Production pages, sitemap, and IndexNow verification file return HTTP 200.

Ongoing launch steps:

1. Track indexing status weekly for the first month and revise pages that are discovered but not indexed.
2. Monitor Search Console query impressions and click-through rate.
3. Keep `https://myreadnest.org/sitemap.xml` submitted after each production deploy through the workflow.
4. Add original screenshots, teacher/parent testimonials, and demo clips as soon as real users have tested the app.
5. Publish one helpful early-reading article each week for at least eight weeks.

## Top-of-Funnel And Commercial-Intent Pass

The original 12 static SEO pages were all bottom-of-funnel or mid-funnel (grade-specific reading, sight words, pricing, teacher dashboard). To lift the traffic ceiling, this pass adds:

- **Trust hub**: `/kid-safe/` — closes the sale on every other page (no ads, no data selling, no chat, COPPA, screen time).
- **Comparison cluster**: `/vs/` hub plus `/vs/abcmouse/`, `/vs/reading-eggs/`, `/vs/homer/`, `/vs/hooked-on-phonics/` — high commercial-intent head-to-heads.
- **Highest-LTV landing**: `/for-tutors/` — dedicated Teacher Pro entry for tutors and small-group specialists.
- **Symptom-first top-of-funnel**: `/my-child-cant-read-yet/` — pulls anxious-parent search intent the solution-first pages cannot reach.
- **EEAT anchor**: `/science-of-reading/` — deep evidence piece; citation magnet and internal-linking hub.
- **Focused pricing rewrite**: `/pricing/` now answers "is it worth it for one kid?" directly and includes a Family Plus vs Teacher Pro table with a real tutoring cost comparison.

Every new page inherits FAQPage and BreadcrumbList JSON-LD, canonical + Open Graph metadata, sitemap entry, cross-page nav links, and Playwright + rich-results validation coverage from `scripts/generate-seo-pages.mjs` and `scripts/validate-rich-results.mjs`.

Research basis:

- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google JavaScript SEO Basics: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Google Structured Data: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google Software App Structured Data: https://developers.google.com/search/docs/appearance/structured-data/software-app
- Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- Schema.org `SoftwareApplication`: https://schema.org/SoftwareApplication

## Content Rules

- Keep copy parent-friendly and specific: short practice, grade range, what kids do, what adults see.
- Do not claim diagnosis, guaranteed reading outcomes, or school certification.
- Avoid collecting or publishing child-identifying data in marketing, analytics, testimonials, or screenshots.
- Use real feature proof: free activities, progress tracking, teacher assignment, reports, subscription tiers, and support.

## Next SEO Upgrade

GitHub Pages can host static pages, but hash routes limit unique app-route indexing. Before broad paid launch, migrate public marketing pages to Firebase Hosting, a prerender step, or an SSR host so each public route can have unique rendered metadata and stronger Core Web Vitals reporting.
