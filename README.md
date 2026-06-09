# ReadNest

ReadNest is a React MVP for children in kindergarten through grade 2 who are practicing early reading and age-appropriate memory skills.

## What The MVP Includes

- Reading practice with level-based sight words, phonics blending, and short sentences.
- Browser read-aloud support using the built-in SpeechSynthesis API.
- Memory matching using school-ready concepts like healthy habits, kind words, and classroom routines.
- Caregiver progress view with known words, reading sessions, memory boards, and next-step suggestions.
- Teacher/admin dashboard with roster, student strengths, growth areas, and intervention planning.
- Donation and subscription support page using Stripe Payment Links.
- Auth0-ready account page with Google, Facebook, and Instagram connection buttons.
- Firebase Firestore-ready progress repository with local storage fallback for development.
- Responsive layout for desktop, tablet, and phone-sized screens.

## Run It

```bash
npm install
npm run start
```

Then visit `http://localhost:4173`.

## Quality Check

```bash
npm run check
npm run build
npm audit --audit-level=moderate
```

## SEO

The app includes metadata, Open Graph/Twitter preview tags, structured data, `robots.txt`, `sitemap.xml`, a web manifest, a social preview image, and crawlable static SEO pages.

Before production launch, replace the placeholder canonical URL `https://readnest.app/` in:

- `index.html`
- `public/robots.txt`
- `public/sitemap.xml`

Static SEO pages currently live in:

- `public/reading-practice/`
- `public/phonics-practice/`
- `public/sight-words/`
- `public/memory-games/`
- `public/teacher-dashboard/`
- `public/caregiver-progress/`

For a larger production site, replace these static pages with prerendered or server-rendered routes.

## Architecture

```text
src/
  main.tsx                         React entrypoint
  RootApp.tsx                      App shell, navigation, progress wiring
  data/content.ts                  Reading levels, memory cards, caregiver tips
  features/auth/                   Auth0-ready account and social login boundary
  features/reading/                Sight word, phonics, and sentence flow
  features/memory/                 Matching game flow
  features/progress/               Caregiver-facing progress view
  features/support/                Donation and subscription page
  features/teacher/                Teacher/admin insights dashboard
  services/firebase.ts             Firebase runtime configuration
  services/classroomRepository.ts  Classroom roster data boundary
  services/learningAnalysisService.ts Rule-based analysis and AI handoff boundary
  services/progressRepository.ts   Firestore/local progress persistence
  shared/speech.ts                 Read-aloud adapter
  styles.css                       Responsive product UI
```

## Auth And Database

The app is structured for Auth0 social sign-in and Firebase Firestore storage. See `docs/firebase-setup.md` for setup details, required environment variables, Firestore document paths, and security-rule notes.

Current behavior:

- If Auth0 env values are missing, the account page uses demo sign-in.
- If Firebase env values are missing, progress is stored in browser local storage.
- When Firebase is configured and a Firebase-authenticated user is available, progress saves to `users/{userId}/learning/progress`.
- Teacher/admin classroom data is planned under `classrooms/{classroomId}` and requires trusted backend-assigned role claims.

## Donations And Subscriptions

The app uses Stripe Payment Links for donations and subscriptions so payment details are handled by Stripe-hosted checkout pages.

Required production values:

- `VITE_STRIPE_DONATION_LINK`
- `VITE_STRIPE_FAMILY_PLUS_LINK`
- `VITE_STRIPE_TEACHER_PRO_LINK`

Suggested subscriptions:

- Free Reader: core reading and memory practice.
- Family Plus: multiple child profiles, cloud sync, printable plans, more content packs.
- Teacher Pro: classroom dashboard, student analysis, intervention planning, exports, AI-ready recommendations.

## Product Plan

### MVP

- Short reading practice loops for young attention spans.
- Read-aloud support and large typography.
- Memory matching with familiar, developmentally appropriate concepts.
- Local fallback so the app can be tested before cloud credentials are connected.

### Next Milestone

- Add child profiles.
- Add the Auth0-to-Firebase custom-token bridge or switch to Firebase Auth as primary auth.
- Replace demo classroom data with Firestore classroom enrollment data.
- Add backend AI analysis endpoint for evidence-based teacher recommendations.
- Add a content editor for caregivers or teachers.
- Track accuracy separately from completion.
- Add printable practice sheets.
- Add offline-first PWA support.

### Long-Term Direction

- Introduce adaptive practice based on missed words.
- Support multiple languages and dialect-aware pronunciation.
- Add teacher dashboards with classroom-level insights.
- Add audit trails for AI-generated recommendations.
- Add rigorous accessibility testing and age-appropriate usability testing.
