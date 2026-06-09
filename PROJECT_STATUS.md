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
- Added Firebase Firestore-ready repository and security rules.
- Added donation/subscription support page using Stripe Payment Links.
- Added SEO metadata, sitemap, robots file, web manifest, Open Graph image, and static SEO pages.
- Added GitHub Pages deployment workflow.
- Deployed successfully to GitHub Pages.

## Not Yet Fully Connected

- Stripe Payment Links need to be created in the owner's Stripe account and added as env values.
- Firebase project credentials need to be added.
- Auth0 or Firebase Auth needs to be configured for real sign-in.
- Firestore live writes require Firebase Auth or an Auth0-to-Firebase token bridge.
- AI analysis needs a backend endpoint before using real AI on student data.

## Verification Last Run

- `npm run check`
- `npm run build`
- `npm audit --audit-level=moderate`
- GitHub Pages deployment succeeded.
- Live URL returned HTTP 200.

## Development Notes

Use `.codex/project.md` as the project memory/handoff file when continuing work in Codex.
