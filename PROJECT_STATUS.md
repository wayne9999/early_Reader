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
- Added teacher request approval, assigned-student history, progress snapshots, strengths, growth areas, and intervention planning.
- Added Firestore security rules for profiles, progress, event history, and assignment links.
- Added donation/subscription support page using Stripe Payment Links.
- Added trusted subscription architecture using `subscriptions/{uid}` as production paid-access authority.
- Added Firebase Functions scaffold for Stripe webhooks, billing portal sessions, and future AI recommendation requests.
- Added teacher invite-code creation scaffold.
- Added privacy/legal/refund/teacher terms pages and footer links.
- Added go-live, Stripe, production environment, and deployment docs.
- Added SEO metadata, sitemap, robots file, web manifest, Open Graph image, and static SEO pages.
- Added GitHub Pages deployment workflow.
- Deployed successfully to GitHub Pages.

## Not Yet Fully Connected

- Facebook and Instagram sign-in still need provider setup/custom-provider work.
- Stripe webhook code exists, but it still needs Firebase Functions dependency install, secrets, deploy, Stripe webhook registration, and end-to-end test events.
- Teacher-created invitation codes can be created, but invite acceptance/revocation/admin tooling still needs completion.
- AI recommendation request endpoint is a placeholder. Real AI generation must run in a backend worker after consent/legal review.
- Parent multi-child profiles, placement onboarding, printable sheets, and production data deletion tooling still need completion.
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
