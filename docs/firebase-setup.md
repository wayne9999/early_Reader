# Firebase And Auth Setup

## Required Project Split

Use two Firebase projects:

| Environment | Firebase project | Frontend hosting |
| --- | --- | --- |
| Development | `readnest-dev-f9c67` | GitHub Pages |
| Production | `readnest-f9c67` | Firebase Hosting |

Firebase Auth users, Firestore documents, Cloud Functions, Secret Manager
values, App Check, and analytics stay inside their environment's project.
Create synthetic QA accounts in development. Never copy production child
profiles, learning history, support messages, or teacher data into development.

The app is now structured for:

- Firebase Authentication for Google and Facebook sign-in.
- Firebase Firestore for user profile, role, subscription authority, progress, event history, invites, and teacher assignment storage.
- Auth0/custom-provider path for Instagram if that remains a product requirement.
- Local storage fallback when Firebase/Auth0 environment values are missing.

## Firestore Collections

```text
users/{userId}
  uid
  role
  signupPath
  displayName
  email
  picture
  teacherCode
  certificationState
  certificationId
  certificationStatus
  certificationNote
  subscriptionTier
  subscriptionStatus
  subscriptionPromptSkippedAt
  createdAt
  updatedAt

subscriptions/{userId}
  userId
  tier
  status
  source
  currentPeriodEnd
  cancelAtPeriodEnd
  stripeCustomerId
  stripeSubscriptionId
  lastStripeEventId
  lastPaymentError
  createdAt
  updatedAt
  updatedBy

users/{userId}/learning/progress
  knownWords
  readingSessions
  memoryWins
  memoryMoves
  memoryTurns
  bestMemoryTurns
  completedToday
  lastPracticeDate
  updatedAt

users/{userId}/learningEvents/{eventId}
  userId
  type
  label
  area
  metadata
  createdAt

teacherProfiles/{teacherId}
  uid
  displayName
  email
  picture
  teacherCode
  certificationState
  certificationId
  certificationStatus
  certificationNote
  bio
  gradeBands
  specialties
  maxStudentLoad
  activeStudentCount
  payModelNote
  createdAt
  updatedAt

teacherDirectory/{teacherId}
  uid
  displayName
  email
  teacherCode
  certificationState
  certificationStatus
  certificationNote
  bio
  gradeBands
  specialties
  maxStudentLoad
  activeStudentCount
  payModelNote
  updatedAt

teacherStudentLinks/{teacherId_studentId}
  teacherId
  teacherName
  teacherEmail
  studentId
  studentName
  studentEmail
  status
  latestProgressSnapshot
  requestedAt
  updatedAt

studentPlacementQueue/{studentId}
  studentId
  studentName
  studentEmail
  status
  holdingTeacherName
  requestedTeacherId
  requestedTeacherName
  assignedTeacherId
  assignedTeacherName
  latestProgressSnapshot
  requestedAt
  assignedAt
  createdAt
  updatedAt
  createdBy
  updatedBy

teacherInvites/{inviteId}
  teacherId
  teacherName
  code
  status
  autoApprove
  expiresAt
  acceptedBy
  createdAt
  updatedAt
  createdBy
  updatedBy

analyticsEvents/{eventId}
  userId
  eventName
  metadata
  createdAt

supportCases/{caseId}
  userId
  status
  category
  message
  createdAt
  updatedAt

classrooms/{classroomId}
  name
  teacherIds
  createdAt
  updatedAt

classrooms/{classroomId}/students/{studentId}
  userId
  displayName
  gradeBand
  consentStatus
  enrolledAt
  latestProgressSnapshot

classrooms/{classroomId}/analyses/{analysisId}
  studentId
  generatedBy
  model
  sourceDataWindow
  summary
  strengths
  growthAreas
  recommendedPlan
  createdAt
```

## Required Environment Values

Create `.env.local` from `.env.example` and fill in the values:

```text
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_AUDIENCE=
VITE_AUTH0_REDIRECT_URI=http://localhost:4173
VITE_AUTH0_GOOGLE_CONNECTION=google-oauth2
VITE_AUTH0_FACEBOOK_CONNECTION=facebook
VITE_AUTH0_INSTAGRAM_CONNECTION=instagram

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Important Auth Note

Firestore security rules use `request.auth.uid`. That means production Firestore writes need a Firebase-authenticated user identity.

The app now uses Firebase Authentication first when Firebase env values exist. Google and Facebook are Firebase-native sign-in targets. Instagram still needs a custom provider or Auth0 connection.

The current code is ready for Firestore SDK usage and stores data at the correct paths when a Firebase-authenticated session exists. If Auth0 is later used as the identity provider, production should add one of these before enabling live child data:

1. Auth0 to Firebase custom-token exchange through a backend endpoint or Cloud Function.
2. Firebase Authentication as the primary auth provider for Google/Facebook, with a custom provider strategy for Instagram.

The frontend fallback is intentionally safe for development: when Firebase/Auth0 values are missing, or when there is no Firebase-authenticated session yet, it stores progress in browser local storage and does not send child data anywhere.

## Firebase Console Checklist

In Firebase Console:

1. Enable Authentication.
2. Enable Google sign-in.
3. Enable Facebook sign-in after creating the Facebook developer app credentials.
4. Add `wayne9999.github.io` to Authentication authorized domains.
5. Create Firestore Database in production mode.
6. Deploy or paste the rules from `firestore.rules`.

## Role And Assignment Flow

Current MVP behavior:

1. A visitor chooses a signup path before sign-in: `parentChild` or `teacher`.
2. After authentication, the selected path automatically creates the profile role. Parent/child creates a `student`; teacher creates a `teacher`.
3. Teacher signup creates a `teacher` role profile, searchable teacher code, public bio, grade bands, specialties, load settings, and default certification status.
4. The selected signup path is stored in `users/{userId}.signupPath`.
5. Private teacher profiles are written to `teacherProfiles/{teacherId}`.
6. Searchable teacher lookup data is written to `teacherDirectory/{teacherId}`.
7. Students browse or search the limited teacher directory and compare bio, grade fit, specialties, active load, and available capacity.
8. Students create `teacherStudentLinks/{teacherId_studentId}` with `status: "requested"`.
9. Students can skip teacher selection. Skipped students create `studentPlacementQueue/{studentId}` with `status: "unassigned"` and a latest progress snapshot.
10. Teachers with paid dashboard access can see unassigned students and claim them through the `claimPlacementStudent` Cloud Function.
11. The default teacher load is 12 active students. The claim function rejects capacity overflow and updates `teacherDirectory.activeStudentCount` and `teacherProfiles.activeStudentCount`.
12. Teachers approve or decline direct requests from the dashboard. Approval changes the link status to `active` and refreshes the teacher directory active-student count.
13. Student reading, memory, and logged-in activity actions create history records under `users/{studentId}/learningEvents`.
14. Logged activity history includes attempts and completions so dashboards can show interaction volume, answer accuracy, review moments, and practiced skill areas.
15. Students see a simpler dashboard with their recent history, practiced areas, progress counters, and next practice suggestion.
16. Active assigned teachers can read that student's event history, latest progress snapshot, activity-completion summary, accuracy, and recent needs.
17. Teachers can download a concise parent-facing report card for active assigned students using only the data visible in the dashboard.
18. Student signup shows a Family Plus subscribe-or-skip prompt; teacher signup shows a Teacher Pro subscribe-or-skip prompt. Skipping keeps paid features locked.
19. Stripe Customer Portal should be available from Account so subscribers can update payment details, view invoices, or cancel monthly billing. Use a durable portal login link or backend-created portal session, not a short-lived `billing.stripe.com/p/session/...` URL.
20. Stripe Checkout/Billing webhook handling updates `subscriptions/{userId}` from trusted backend code after payment succeeds, renews, fails, refunds, disputes, or is canceled.
21. Premium access checks should use `subscriptions/{userId}` or backend custom claims. Profile subscription fields are development/display fallback only.
22. Teacher-created invite codes are stored in `teacherInvites`; invite acceptance and revocation should be completed with backend validation before broad launch.
23. Teacher compensation should be calculated from active assignment records in trusted backend code before real payouts are made.

The app prevents role switching after profile creation. Firebase Auth also prevents one Google email from becoming two separate accounts under normal email-provider linking rules. For stricter production enforcement, use Cloud Functions or a backend API to validate role creation, custom claims, paid teacher entitlements, duplicate-email policies, and teacher certification status.

Teacher certification in the United States is state-based, not one universal national teacher ID. Production verification should collect the issuing state and license/certificate number, verify it against the state education agency or a vetted verification provider, then set `certificationStatus` from trusted backend/admin code.

## Security Rules

Rules live in `firestore.rules`. They currently allow each signed-in Firebase user to read/update only:

```text
users/{theirUserId}
users/{theirUserId}/learning/progress
users/{theirUserId}/learningEvents
subscriptions/{theirUserId} read-only
```

They also allow:

- Signed-in users to search a limited `teacherDirectory` with query limits.
- Teachers to create/update only their own private `teacherProfiles` when their user role is `teacher`.
- Students to create assignment requests for themselves.
- Students to place themselves in the unassigned holding queue or mark their placement as requested.
- Teachers to list holding-queue students, while assignment claims are handled by trusted backend code.
- Students to update only the latest progress snapshot on their own requested or active assignment links.
- Teachers to approve or decline only their own assignment links.
- Active assigned teachers to read assigned student learning events.
- Clients to read but never write subscription authority.
- Teachers to create invite codes for themselves.

Deletes are denied by default.

Classroom paths are scoped to admins or teachers listed on that classroom:

```text
role: "teacher" | "admin"
```

For production, set privileged admin claims and paid access only from trusted backend code. Do not rely on frontend-only role assignment for high-stakes or paid access control.

## AI Analysis Design

The current teacher dashboard uses rule-based local analysis so the MVP can run without sending child data to an AI provider.

For production AI:

1. Store granular learning events with timestamps and content ids.
2. Send only the needed student/classroom window to a secure backend endpoint.
3. Redact unnecessary personal data before calling an AI model.
4. Require AI output to cite the evidence it used.
5. Store generated recommendations with `model`, `sourceDataWindow`, and `createdAt`.
6. Treat AI as decision support for teachers, not as a diagnostic authority.

## Deployment Checks

```bash
npm run check
npm run build
npm audit --audit-level=moderate
```

Deploying to Firebase Hosting/Firestore requires the Firebase CLI and an authenticated Firebase project.
