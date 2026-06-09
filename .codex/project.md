# Codex Project: ReadNest / early_Reader

## Purpose

ReadNest is a web application for early elementary children learning to read. It includes reading practice, phonics, sight words, memory games, caregiver progress, role-aware student and teacher workspaces, teacher assignment requests, SEO pages, donation support, and subscription-plan scaffolding.

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
- Firebase Auth and Firestore-ready data layer
- Auth0-ready fallback/social login boundary
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
- Student teacher-search and assignment request flow
- Teacher insight dashboard with assigned-student history
- Account/social sign-in screen
- Donation/subscription support page
- Static SEO landing pages

## Current Architecture Notes

- Users choose either `student` or `teacher` after sign-in. The frontend locks that profile after creation.
- Progress and learning events fall back to browser `localStorage` until Firebase and a Firebase-authenticated user are available.
- Firestore paths in active use: `users/{uid}`, `users/{uid}/learning/progress`, `users/{uid}/learningEvents/{eventId}`, `teacherProfiles/{teacherId}`, and `teacherStudentLinks/{teacherId_studentId}`.
- Students search teacher profiles by email or teacher code, then request assignment. Teachers approve requests in their dashboard.
- Auth0 UI exists, but production Firestore writes require Firebase Auth or an Auth0-to-Firebase custom-token bridge.
- AI analysis is currently rule-based in the browser. Production AI should run only from a backend or Cloud Function.
- Stripe Payment Links are configured, but paid subscription enforcement still needs a backend webhook and trusted entitlement storage.

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

1. Deploy updated Firestore rules after every rules change.
2. Add Stripe webhook handling for Family Plus and Teacher Pro entitlements.
3. Add teacher-created student invitations in addition to student-initiated requests.
4. Add a backend AI endpoint for teacher analysis.
5. Replace remaining demo teacher fallback data with live Firestore records.
6. Add route-level navigation and possibly prerendering/SSR for better SEO at scale.
7. Add automated tests for reading, memory, progress, support, role, assignment, and teacher flows.
