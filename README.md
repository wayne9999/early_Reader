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
- Firebase Auth account page with Google and Facebook support, plus an Instagram custom-provider placeholder.
- Firebase Firestore profile, assignment, event, and progress repositories with local storage fallback for development.
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

## App Routes

ReadNest uses hash-based routes so deep links work on GitHub Pages without a server rewrite. These are the current shareable app URLs:

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
  features/teacher/                Teacher insights and assigned-student dashboard
  services/firebase.ts             Firebase runtime configuration
  services/appRoutes.ts            Shareable hash routes and role-aware access rules
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
- Signed-in users are assigned one locked app role from the signup path they selected before authentication: `student` for Parent / Child, `teacher` for Teacher.
- Teacher certification is state-based in the United States. The app stores certification verification as `notSubmitted`, `pendingReview`, `verified`, or `rejected`; production verification should check the teacher's issuing state agency or a trusted background-check workflow.
- Teacher lookup uses `teacherProfiles/{teacherId}` by email or teacher code.
- Students can browse or search the limited `teacherDirectory` and review each teacher's bio, grade bands, specialties, load, and pay/load note before requesting.
- Student assignment requests use `teacherStudentLinks/{teacherId_studentId}` and start as `requested`.
- Teachers approve or decline requests from their dashboard; approved students become active assignments.
- Teacher workload is tracked through `activeStudentCount` and `maxStudentLoad` so students are guided toward teachers with available capacity.
- Student interaction history is stored under `users/{studentId}/learningEvents/{eventId}`.
- Active assigned teachers can read assigned student event history through Firestore rules and see reading, memory, and logged-in activity completions in the dashboard.
- Teachers can download a concise HTML report card for each active assigned student. The report is generated in-browser from the teacher-visible data and escapes report text before writing the file.
- Teacher compensation should be calculated on trusted backend data from active assignments before real payouts are made.
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
- Add backend payout reporting for teachers based on active assigned students and approved pay rules.
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
