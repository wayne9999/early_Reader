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
- Firebase Functions for Stripe webhooks, billing portal sessions, AI insights, scheduled jobs, and OpenAI budget guarding
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
VITE_STRIPE_CUSTOMER_PORTAL_LINK=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_FAMILY_PLUS_PRICE_ID=
STRIPE_TEACHER_PRO_PRICE_ID=
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
- Trusted paid access belongs in `subscriptions/{uid}` and is written by Stripe webhook/backend code, not by the frontend.
- Students search teacher profiles by email or teacher code, then request assignment. Teachers approve requests in their dashboard.
- Teachers can create invite codes through `teacherInvites`.
- Auth0 UI exists, but production Firestore writes require Firebase Auth or an Auth0-to-Firebase custom-token bridge.
- AI analysis is currently rule-based in the browser. Production AI should run only from a backend or Cloud Function.
- Firebase Functions include Stripe webhook handling, Customer Portal session creation, AI insight jobs, scheduled insight enqueueing, OpenAI provider calls, monthly budget guarding, and rule-based fallback.
- Parent / Child profile creation requires parent/caregiver consent and stores consent metadata on the user profile.
- Signed-in support cases are stored in `supportCases` for billing, deletion, teacher verification, technical, and general requests.

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
2. Register and verify Stripe webhook handling for Family Plus and Teacher Pro entitlements with Stripe test events.
3. Complete student invite-code acceptance and admin invite revocation.
4. Add production monitoring and prompt evaluation for the backend AI recommendation worker after legal review.
5. Replace remaining demo teacher fallback data with live Firestore records.
6. Add route-level navigation and possibly prerendering/SSR for better SEO at scale.
7. Add automated tests for reading, memory, progress, support, role, assignment, and teacher flows.
