# ReadNest Project Status

## Live

- GitHub repo: https://github.com/wayne9999/early_Reader
- Hosted app: https://wayne9999.github.io/early_Reader/

## Completed

- Converted from static HTML/JS to React + TypeScript + Vite.
- Added reading, phonics, sentence, and memory practice.
- Added caregiver progress dashboard.
- Added teacher/admin dashboard with rule-based analysis.
- Added Auth0-ready account page for Google, Facebook, and Instagram.
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
- Added teacher invite-code creation scaffold.
- Added parent/caregiver consent storage before child/student profile creation.
- Added Firestore-backed support cases for billing, deletion, teacher verification, technical, and general requests.
- Added privacy/legal/refund/teacher terms pages and footer links.
- Added go-live, Stripe, production environment, and deployment docs.
- Added SEO metadata, sitemap, robots file, web manifest, Open Graph image, and static SEO pages.
- Completed the first live authenticated release QA cycle; see `docs/qa-release-2026-06-25.md` for tested journeys, fixes, and remaining launch work.
- Added GitHub Pages deployment workflow.
- Added Firebase backend deployment workflow for rules, functions, secrets, and scheduled functions.
- Deployed successfully to GitHub Pages.
- Deployed Firebase rules, Functions, Stripe/OpenAI secrets, and scheduled AI insight job through GitHub Actions.

## Not Yet Fully Connected

- Facebook and Instagram sign-in still need provider setup/custom-provider work.
- Stripe webhook code is deployed with secrets, but it still needs Stripe Dashboard endpoint registration and end-to-end test events.
- Teacher-created invitation codes can be created, but invite acceptance/revocation/admin tooling still needs completion.
- AI insight generation uses a backend OpenAI adapter with a rule-based fallback. Legal review, prompt evaluation, and production monitoring are still needed before broad launch.
- Parent multi-child profiles, placement onboarding, printable sheets, and backend data deletion fulfillment still need completion.
- Production role enforcement should move to backend logic/custom claims before live classroom use at scale.

## Verification Last Run

- `npm run check`
- `npm run test`
- `npm run test:e2e`
- `npm run test:coverage`
- `VITE_BASE_PATH=/early_Reader/ npm run build`
- `npm audit --audit-level=moderate`
- GitHub Pages deployment succeeded.
- Live URL returned HTTP 200.

## Development Notes

Use `.codex/project.md` as the project memory/handoff file when continuing work in Codex.
