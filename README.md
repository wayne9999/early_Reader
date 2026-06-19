# ReadNest

ReadNest is a React MVP for children in kindergarten through grade 2 who are practicing early reading and age-appropriate memory skills.

For Codex continuity and project handoff notes, see `.codex/project.md` and `PROJECT_STATUS.md`.

## What The MVP Includes

- Reading practice with level-based sight words, phonics blending, and short sentences.
- Browser read-aloud support using the built-in SpeechSynthesis API.
- Memory matching using school-ready concepts like healthy habits, kind words, and classroom routines.
- Caregiver progress view with known words, reading sessions, memory boards, and next-step suggestions.
- Role-aware student and teacher workspaces.
- Student learning-event history for reading, sentence, and memory interactions.
- Teacher dashboard with assigned-student roster, approval requests, strengths, growth areas, history, and intervention planning.
- Donation and subscription support page using Stripe Payment Links.
- Firebase Auth account page with Google and Facebook support, plus an Instagram custom-provider placeholder.
- Firebase Firestore profile, assignment, event, and progress repositories with local storage fallback for development.
- Responsive layout for desktop, tablet, and phone-sized screens.

## Run It

Use Node 24.17+.

```bash
npm install
npm run start
```

If you use a Node version manager, run `nvm use` or the equivalent first.

Then visit `http://localhost:4173`.

## Quality Check

```bash
npm run check
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm audit --audit-level=moderate
```

The project uses Node 24.17+ so local development, Vitest, jsdom, Playwright, Firebase tooling, and GitHub Actions stay on the same LTS runtime.

Test metrics:

- Unit/integration results print in the terminal from `npm run test`.
- Coverage prints in the terminal and writes an HTML report to `coverage/index.html`.
- Browser automation writes an HTML report to `playwright-report/index.html`.
- On GitHub, open the latest Actions run and download the `coverage-report` and `playwright-report` artifacts.

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
  features/auth/                   Firebase/Auth0-ready account and social login boundary
  features/reading/                Sight word, phonics, and sentence flow
  features/memory/                 Matching game flow
  features/progress/               Caregiver-facing progress view
  features/student/                Student teacher-search and assignment request flow
  features/support/                Donation and subscription page
  features/teacher/                Teacher insights and assigned-student dashboard
  services/firebase.ts             Firebase runtime configuration
  services/assignmentRepository.ts Teacher-student assignment persistence
  services/classroomRepository.ts  Classroom roster data boundary
  services/learningEventRepository.ts Student interaction event history
  services/learningAnalysisService.ts Rule-based analysis and AI handoff boundary
  services/progressRepository.ts   Firestore/local progress persistence
  services/userProfileRepository.ts Student/teacher profile persistence
  shared/speech.ts                 Read-aloud adapter
  styles.css                       Responsive product UI
```

## Auth And Database

The app now uses Firebase Auth first when Firebase env values exist, and Firebase Firestore for progress storage. See `docs/firebase-setup.md` for setup details, required environment variables, Firestore document paths, and security-rule notes.

Current behavior:

- If Firebase env values are present, the account page uses Firebase Auth.
- If Firebase/Auth0 env values are missing, the account page uses demo sign-in.
- If Firebase env values are missing, progress is stored in browser local storage.
- When Firebase is configured and a Firebase-authenticated user is available, progress saves to `users/{userId}/learning/progress`.
- Signed-in users choose one locked app role: `student` or `teacher`.
- Teacher lookup uses `teacherProfiles/{teacherId}` by email or teacher code.
- Student assignment requests use `teacherStudentLinks/{teacherId_studentId}`.
- Student interaction history is stored under `users/{studentId}/learningEvents/{eventId}`.
- Active assigned teachers can read assigned student event history through Firestore rules.
- Production role and paid-entitlement enforcement should move to trusted backend logic or Firebase custom claims before handling real classrooms at scale.

## Donations And Subscriptions

The app uses Stripe Payment Links for donations and subscriptions so payment details are handled by Stripe-hosted checkout pages.

Required production values:

- `VITE_STRIPE_DONATION_LINK`
- `VITE_STRIPE_FAMILY_PLUS_LINK`
- `VITE_STRIPE_TEACHER_PRO_LINK`

Optional support value:

- `VITE_SUPPORT_EMAIL` sets the mailbox used by the Support page email link.

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
- Finish Firebase Auth provider setup in Firebase Console.
- Add Instagram through a custom provider or Auth0 bridge if that remains a requirement.
- Add teacher-created student invitations and Stripe webhook entitlement checks for Teacher Pro.
- Replace remaining demo classroom fallback data with fully live Firestore enrollment data.
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
