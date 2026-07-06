# ReadNest Project Status

## Live

- GitHub repo: https://github.com/wayne9999/early_Reader
- Production domain: https://myreadnest.org/
- Temporary fallback: https://wayne9999.github.io/early_Reader/

## Completed

- Converted from static HTML/JS to React + TypeScript + Vite.
- Added reading, phonics, sentence, and memory practice.
- Added caregiver progress dashboard.
- Added teacher/admin dashboard with rule-based analysis.
- Added Firebase-ready account page for email/password, Google, and Facebook.
- Added Firebase Auth profile roles for student and teacher accounts.
- Added Firestore progress, learning-event history, teacher profile, and teacher-student assignment repositories.
- Added student teacher-search and assignment request flow.
- Added student holding-space queue for skipped teacher selection and backend teacher claim flow with capacity enforcement.
- Added teacher request approval, assigned-student history, progress snapshots, strengths, growth areas, and intervention planning.
- Added Firestore security rules for profiles, progress, event history, and assignment links.
- Added donation/subscription support page using Stripe Payment Links.
- Added trusted subscription architecture using `subscriptions/{uid}` as production paid-access authority.
- Added Firebase Functions for Stripe webhooks, backend-created subscription checkout sessions, and billing portal sessions.
- Added backend AI-learning workflow foundation with requestable/scheduled insight jobs, deterministic summaries, secure student insight storage, and teacher dashboard display.
- Added OpenAI-backed insight adapter with backend budget guard, scheduled processing, and rule-based fallback.
- Added personalized student setup and practice paths based on grade level, reading goal, saved learning events, and Learning Coach recommendations.
- Added teacher invite-code creation scaffold.
- Added parent/caregiver consent storage before child/student profile creation.
- Added Firestore-backed support cases for billing, deletion, teacher verification, technical, and general requests.
- Added privacy/legal/refund/teacher terms pages and footer links.
- Added go-live, Stripe, production environment, and deployment docs.
- Added SEO metadata, sitemap, robots file, web manifest, Open Graph image, and static SEO pages.
- Completed the first live authenticated release QA cycle; see `docs/qa-release-2026-06-25.md` for tested journeys, fixes, and remaining launch work.
- Completed a full-stack paid-product pressure test with fixes for checkout popup blocking, webhook ordering, claim revocation on refunds/disputes, partial-refund handling, scheduled AI consent enforcement, and Firestore rule tightening; see `docs/pressure-test-2026-07-05.md`.
- Added GitHub Pages deployment workflow.
- Added Firebase backend deployment workflow for rules, functions, secrets, and scheduled functions.
- Deployed successfully to GitHub Pages.
- Deployed Firebase rules, Functions, Stripe/OpenAI secrets, and scheduled AI insight job through GitHub Actions.

- Completed the launch-blocker follow-up: automated Stripe webhook registration workflow, production-default App Check enforcement, invite acceptance/revocation flow (`acceptTeacherInvite` callable + Find Teacher redemption + dashboard revoke), and admin data-deletion fulfillment (`fulfillDataDeletion` callable + `docs/data-deletion-runbook.md`).
- Automated search-engine submission: IndexNow (Bing/Yandex) URL submission, Search Console API sitemap submission and URL inspection (pending `GSC_SERVICE_ACCOUNT_JSON` secret), local Rich Results validation in `validate:seo`, and the **Submit To Search Engines** workflow that runs after every production deploy. See `docs/growth-seo-plan.md`.

## Not Yet Fully Connected

- Facebook sign-in needs Firebase Console provider setup with the Meta app ID and secret before live use.
- Stripe webhook registration is automated by the **Register Stripe Webhook** GitHub Actions workflow; it still needs one run in test mode and one approved run in live mode.
- App Check enforcement is now the production default; the reCAPTCHA v3 site key (`PROD_VITE_FIREBASE_APP_CHECK_SITE_KEY`) must be registered before the next production deploy or the build fails validation.
- AI insight generation uses a backend OpenAI adapter with a rule-based fallback. Legal review, prompt evaluation, and production monitoring are still needed before broad launch.
- Parent multi-child profiles, placement onboarding, and printable sheets still need completion.
- Production role enforcement should move to backend logic/custom claims before live classroom use at scale.

## Verification Last Run

- `npm run check`
- `npm run test`
- `npm run test:e2e`
- `npm run test:coverage`
- `VITE_BASE_PATH=/ npm run build`
- `npm audit --audit-level=moderate`
- GitHub Pages deployment succeeded.
- Live URL returned HTTP 200.

## Development Notes

Use `.codex/project.md` as the project memory/handoff file when continuing work in Codex.
