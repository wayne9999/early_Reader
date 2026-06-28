# ReadNest

ReadNest is a React MVP for children in kindergarten through grade 2 who are practicing early reading and age-appropriate memory skills.

For Codex continuity and project handoff notes, see `.codex/project.md` and `PROJECT_STATUS.md`.

## What The MVP Includes

- Reading practice with level-based sight words, phonics blending, and short sentences.
- Browser read-aloud support using the built-in SpeechSynthesis API.
- Memory matching using school-ready concepts like healthy habits, kind words, and classroom routines.
- Five extra logged-in student activities for rhyming, beginning sounds, sentence order, story sequencing, and word meaning.
- Caregiver progress view with known words, reading sessions, memory boards, and next-step suggestions.
- Role-aware student and teacher workspaces with signup-path auto assignment after authentication.
- Student learning-event history for reading, sentence, and memory interactions.
- Teacher dashboard with assigned-student roster, approval requests, strengths, growth areas, history, and intervention planning.
- Teacher accounts can also open the student-facing reading, memory, and skill activities so they can review the learner experience.
- Downloadable teacher report cards for assigned students with quarter and annual goal comparisons for parent sharing.
- Student teacher selection with teacher bios, grade fit, specialties, visible workload, and request approval.
- Donation and subscription support page using Stripe Payment Links.
- Trusted subscription architecture using `subscriptions/{userId}` as the production paid-access source of truth.
- Free vs paid student activity access: free students get Reading, Memory, Rhymes, Sounds, and Sentences; Family Plus is the paid path for Story Steps, Word Garden, printable plans, and future premium packs.
- Teacher Pro gating for classroom dashboard, student analysis, reports, intervention planning, and future AI recommendations.
- Teacher-created invite-code scaffold for families.
- Legal/support pages for privacy, terms, children's privacy, parent consent, teacher terms, refunds, billing help, and data deletion requests.
- Firebase Auth account page with Google and Facebook support, plus an Instagram custom-provider placeholder.
- Firebase Firestore profile, assignment, event, and progress repositories with local storage fallback for development.
- Personalized student paths using grade, reading goal, recent learning events, and Learning Coach insights.
- Shareable app URLs for each main page, including protected-page login redirects.
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
npm run validate:content
```

The project uses Node 24.17+ so local development, Vitest, jsdom, Playwright, Firebase tooling, and GitHub Actions stay on the same LTS runtime.

Test metrics:

- Unit/integration results print in the terminal from `npm run test`.
- Coverage prints in the terminal and writes an HTML report to `coverage/index.html`.
- Browser automation writes an HTML report to `playwright-report/index.html`.
- On GitHub, open the latest Actions run and download the `coverage-report` and `playwright-report` artifacts.

## SEO

The app includes metadata, Open Graph/Twitter preview tags, structured data, `robots.txt`, `sitemap.xml`, a web manifest, a social preview image, crawlable static SEO pages, and a growth checklist in `docs/growth-seo-plan.md`.

The production canonical base URL is `https://myreadnest.org/`. The canonical URL is reflected in:

- `index.html`
- every crawlable page under `public/*/index.html`
- `public/robots.txt`
- `public/sitemap.xml`

Static SEO pages currently live in:

- `public/reading-practice/`
- `public/online-reading-games/`
- `public/kindergarten-reading/`
- `public/first-grade-reading/`
- `public/second-grade-reading/`
- `public/phonics-practice/`
- `public/sight-words/`
- `public/memory-games/`
- `public/teacher-dashboard/`
- `public/reading-intervention/`
- `public/caregiver-progress/`
- `public/pricing/`

For a larger production site, replace these static pages with prerendered or server-rendered routes.

## App Routes

ReadNest currently uses hash-based routes so links remain portable across the
Firebase Hosting production site and the GitHub Pages development site. These
are the current shareable app URLs:

- `#/reading`
- `#/memory`
- `#/donate`
- `#/support`
- `#/account`
- `#/progress` for signed-in students
- `#/find-teacher` for signed-in students
- `#/rhymes` for signed-in students
- `#/sound-sort` for signed-in students
- `#/sentence-builder` for signed-in students
- `#/story-order` for signed-in students
- `#/word-meaning` for signed-in students
- `#/teacher` for signed-in teachers and admins

Guest-accessible routes open directly. Guests can use Reading and Memory as the open practice activities. The five added skill activities are student-only, so protected activity links redirect guests to the neutral Account page at `#/account?next={route}` and save the requested route in session storage. The Account page does not assume whether the link is meant for a student or teacher; the user still chooses the correct account path. After sign-in and role setup, ReadNest opens the saved route when that role is allowed to access it, otherwise it sends the user to the correct home page for their role.

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
  features/legal/                  Privacy, terms, children privacy, consent, refunds
  features/teacher/                Teacher insights and assigned-student dashboard
  functions/                       Firebase Functions backend for Stripe and AI placeholders
  services/firebase.ts             Firebase runtime configuration
  services/appRoutes.ts            Shareable hash routes and role-aware access rules
  services/assignmentRepository.ts Teacher-student assignment persistence
  services/classroomRepository.ts  Classroom roster data boundary
  services/learningEventRepository.ts Student interaction event history
  services/learningAnalysisService.ts Rule-based analysis and AI handoff boundary
  services/productAnalytics.ts     Privacy-conscious product event tracking
  services/subscriptionRepository.ts Trusted subscription state reader
  services/teacherInviteRepository.ts Teacher invite-code persistence
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
- Signed-in users are assigned one locked app role from the signup path they selected before authentication: `student` for Parent / Child, `teacher` for Teacher.
- Parent / Child setup requires parent or caregiver consent before the student profile is created. Consent metadata is stored on `users/{userId}`.
- New student signups see a Family Plus subscribe-or-skip prompt. Skipping keeps the account on the free entitlement set.
- Student accounts can open Stripe Customer Portal from Account to update payment details or cancel monthly billing.
- Teacher certification is state-based in the United States. The app stores certification verification as `notSubmitted`, `pendingReview`, `verified`, or `rejected`; production verification should check the teacher's issuing state agency or a trusted background-check workflow.
- Teacher lookup uses `teacherProfiles/{teacherId}` by email or teacher code.
- Students can browse or search the limited `teacherDirectory` and review each teacher's bio, grade bands, specialties, load, and pay/load note before requesting.
- Student assignment requests use `teacherStudentLinks/{teacherId_studentId}` and start as `requested`.
- Teachers approve or decline requests from their dashboard; approved students become active assignments.
- Teacher workload is tracked through `activeStudentCount` and `maxStudentLoad` so students are guided toward teachers with available capacity.
- Student interaction history is stored under `users/{studentId}/learningEvents/{eventId}`, including answer attempts, memory attempts, completions, and read-aloud interactions.
- Student dashboard summarizes their own progress, recent activity, practiced skill areas, accuracy, and a next practice suggestion.
- Active assigned teachers can read assigned student event history through Firestore rules and see richer evaluation data: interactions, accuracy, review moments, practiced areas, reading, memory, and logged-in activity completions.
- Teachers can download a concise HTML report card for each active assigned student. The report is generated in-browser from the teacher-visible data and escapes report text before writing the file.
- Production paid access reads `subscriptions/{userId}`. Firestore rules prevent client writes to subscription authority.
- Teacher compensation should be calculated on trusted backend data from active assignments before real payouts are made.
- Firebase Functions in `functions/` handle Stripe webhooks, billing portal sessions, AI insight jobs, scheduled processing, OpenAI budget guarding, and rule-based fallback.
- Signed-in support requests are stored in `supportCases`, including billing, data deletion, teacher verification, technical, and general help. Backend deletion/export fulfillment still needs an operations process.

## Donations And Subscriptions

The app uses Stripe Payment Links for donations and subscriptions so payment details are handled by Stripe-hosted checkout pages. Student cancellation should use Stripe Customer Portal so families can stop monthly billing, update cards, and view invoices. `VITE_STRIPE_CUSTOMER_PORTAL_LINK` must be a durable Stripe portal login link or an app backend endpoint that creates a fresh portal session; do not store a short-lived `billing.stripe.com/p/session/...` URL because Stripe portal sessions expire. Production paid access and cancellation are designed to be granted or removed by Stripe Checkout/Billing webhook events that update `subscriptions/{userId}` and Firebase custom claims; frontend-only entitlement changes are not sufficient for real paid access enforcement.

Required production values:

- `VITE_STRIPE_DONATION_LINK`
- `VITE_STRIPE_FAMILY_PLUS_LINK`
- `VITE_STRIPE_TEACHER_PRO_LINK`
- `VITE_STRIPE_CUSTOMER_PORTAL_LINK`: durable Stripe portal login link or backend billing endpoint, not a temporary portal session URL

Backend-only production values are documented in `docs/production-env.md` and `docs/stripe-setup.md`.

## Launch Docs

- `docs/go-live-readiness.md`
- `docs/production-env.md`
- `docs/stripe-setup.md`
- `docs/deployment.md`
- `docs/firebase-setup.md`
- `docs/personalization.md`

Optional support value:

- `VITE_SUPPORT_EMAIL` sets the mailbox used by the Support page email link.

Suggested subscriptions:

- Free Reader: Reading, Memory, Rhymes, Sounds, and Sentences.
- Family Plus: Story Steps, Word Garden, future premium packs, cloud sync, printable plans.
- Teacher Pro: classroom dashboard, student analysis, intervention planning, exports, AI-ready recommendations.

## Product Plan

### MVP

- Short reading practice loops for young attention spans.
- Read-aloud support and large typography.
- Memory matching with familiar, developmentally appropriate concepts.
- Local fallback so the app can be tested before cloud credentials are connected.

### Next Milestone

- Add full multi-child parent profile UI.
- Register and verify the Stripe webhook endpoint with test events.
- Finish Firebase Auth provider setup in Firebase Console.
- Add Instagram through a custom provider or Auth0 bridge if that remains a requirement.
- Complete invite acceptance/revocation UI.
- Add backend payout reporting for teachers based on active assigned students and approved pay rules.
- Replace remaining demo classroom fallback data with fully live Firestore enrollment data.
- Add production monitoring and prompt evaluation for AI-assisted teacher recommendations.
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
