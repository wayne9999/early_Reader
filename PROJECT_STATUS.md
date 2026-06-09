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
- Added SEO metadata, sitemap, robots file, web manifest, Open Graph image, and static SEO pages.
- Added GitHub Pages deployment workflow.
- Deployed successfully to GitHub Pages.

## Not Yet Fully Connected

- Facebook and Instagram sign-in still need provider setup/custom-provider work.
- Teacher Pro payment is linked through Stripe Payment Links, but paid entitlement enforcement still needs a Stripe webhook and backend-controlled user claim or Firestore subscription document.
- Teacher-created student invitations are not fully automated yet; current MVP lets students find and request teachers.
- AI analysis needs a backend endpoint before using real AI on student data.
- Production role enforcement should move to backend logic/custom claims before live classroom use at scale.

## Verification Last Run

- `npm run check`
- `VITE_BASE_PATH=/early_Reader/ npm run build`
- `npm audit --audit-level=moderate`
- GitHub Pages deployment succeeded.
- Live URL returned HTTP 200.

## Development Notes

Use `.codex/project.md` as the project memory/handoff file when continuing work in Codex.
