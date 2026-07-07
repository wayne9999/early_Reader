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

1. Submit `https://myreadnest.org/sitemap.xml` in Google Search Console.
2. Submit the same sitemap in Bing Webmaster Tools.
3. Verify the homepage with Google's Rich Results Test for `SoftwareApplication` and `FAQPage`.
4. Share the homepage and `/online-reading-games/` with parent groups, tutoring communities, and teacher communities.
5. Add real screenshots, short demo videos, and testimonials once families and teachers have tested the app.
6. Move to a custom domain before paid acquisition so canonical URLs and brand trust are stronger.

## July 2026 Crawlability Pass

Completed:

- Added generated static landing pages for the highest-intent parent and teacher search paths.
- Added production canonical URLs for `https://myreadnest.org`.
- Added Open Graph, Twitter preview metadata, JSON-LD, and FAQ structured data on each static page.
- Added `scripts/generate-seo-pages.mjs` so the pages are rebuilt before every production build.
- Added `scripts/validate-seo-assets.mjs` and e2e coverage for sitemap, robots, canonical tags, JSON-LD, and mobile overflow.

## July 2026 Submission Automation

Search-engine submission is now largely automated by the **Submit To Search Engines** workflow (`.github/workflows/submit-search-engines.yml`), which runs automatically after every successful production deploy and can be dispatched manually:

- **Bing (and Yandex/Seznam/Naver)**: `npm run submit:indexnow` pushes every sitemap URL through IndexNow using the key file committed in `public/` (deprecated anonymous sitemap pings no longer exist). No account setup needed; Bing Webmaster Tools account is optional for reporting.
- **Google sitemap submission**: `npm run submit:google` submits the sitemap through the Search Console API. One-time setup: create a Google Cloud service account, add its email as a user of the Search Console property, and store its JSON key as the `GSC_SERVICE_ACCOUNT_JSON` repo secret (set the `GSC_SITE_URL` variable if the property is not `sc-domain:myreadnest.org`).
- **Google URL Inspection**: the same workflow inspects `/`, `/reading-practice/`, `/online-reading-games/`, `/kindergarten-reading/`, and `/teacher-dashboard/` via the URL Inspection API once the secret exists.
- **Rich Results**: `npm run validate:rich-results` validates every generated page's FAQPage and BreadcrumbList JSON-LD against Google's documented requirements locally (it runs in CI and inside `validate:seo`). The interactive https://search.google.com/test/rich-results check of `/reading-practice/` and `/pricing/` remains a nice-to-have visual confirmation.

Remaining truly-manual steps (need the Google/Microsoft account owner):

1. Verify the `myreadnest.org` property in Google Search Console (DNS TXT or HTML file) if not already verified — the API cannot self-verify.
2. Create the service account, grant it Search Console access, and add the `GSC_SERVICE_ACCOUNT_JSON` secret.
3. Optionally add the site in Bing Webmaster Tools (can import from Search Console) for reporting dashboards; indexing submission is already covered by IndexNow.
4. Track indexing status weekly for the first month and revise pages that are discovered but not indexed.

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
