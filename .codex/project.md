# Codex Project: ReadNest / early_Reader

## Purpose

ReadNest is a web application for early elementary children learning to read. It includes reading practice, phonics, sight words, memory games, caregiver progress, teacher/admin insights, SEO pages, donation support, and subscription-plan scaffolding.

## Primary Workspace

```text
C:\Users\wayne\Documents\Codex\2026-06-08\create-a-small-project-that-s
```

## GitHub

```text
Repository: https://github.com/wayne9999/early_Reader
Live app:   https://wayne9999.github.io/early_Reader/
Branch:     main
```

## Tech Stack

- React
- TypeScript
- Vite
- Firebase Firestore-ready data layer
- Auth0-ready social login boundary
- Stripe Payment Links for donations/subscriptions
- GitHub Pages deployment through GitHub Actions

## Key Commands

```bash
npm install
npm run start
npm run check
npm run build
npm audit --audit-level=moderate
```

## Important Environment Values

Copy `.env.example` to `.env.local` and fill values when ready.

```text
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_AUDIENCE=
VITE_AUTH0_REDIRECT_URI=

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

VITE_STRIPE_DONATION_LINK=
VITE_STRIPE_FAMILY_PLUS_LINK=
VITE_STRIPE_TEACHER_PRO_LINK=
```

## Current Product Areas

- Child reading practice
- Phonics blending
- Sight word practice
- Memory matching game
- Caregiver progress dashboard
- Teacher/admin insight dashboard
- Account/social sign-in screen
- Donation/subscription support page
- Static SEO landing pages

## Current Architecture Notes

- Progress falls back to browser `localStorage` until Firebase and a Firebase-authenticated user are available.
- Auth0 UI exists, but production Firestore writes require Firebase Auth or an Auth0-to-Firebase custom-token bridge.
- AI analysis is currently rule-based in the browser. Production AI should run only from a backend or Cloud Function.
- Stripe buttons are disabled until real Stripe Payment Links are added to environment variables.

## Deployment

GitHub Actions deploys `main` to GitHub Pages.

Workflow:

```text
.github/workflows/deploy-pages.yml
```

The workflow builds with:

```text
VITE_BASE_PATH=/early_Reader/
```

## Best Next Steps

1. Create Stripe Payment Links and add them to GitHub Actions/environment configuration.
2. Decide between Firebase Auth as primary auth or Auth0 plus Firebase custom-token bridge.
3. Create the Firebase project and deploy Firestore rules.
4. Replace demo teacher classroom data with Firestore classroom records.
5. Add a backend AI endpoint for teacher analysis.
6. Add route-level navigation and possibly prerendering/SSR for better SEO at scale.
7. Add automated tests for reading, memory, progress, support, and teacher flows.
