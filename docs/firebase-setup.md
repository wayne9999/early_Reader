# Firebase And Auth Setup

The app is now structured for:

- Firebase Authentication for Google and Facebook sign-in.
- Firebase Firestore for user profile, role, progress, event history, and teacher assignment storage.
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
  createdAt
  updatedAt

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
2. Parent/child signup creates a `student` role profile for the child learning workspace.
3. Teacher signup creates a `teacher` role profile, searchable teacher code, public bio, grade bands, specialties, and load settings.
4. The selected signup path is stored in `users/{userId}.signupPath`.
5. Private teacher profiles are written to `teacherProfiles/{teacherId}`.
6. Searchable teacher lookup data is written to `teacherDirectory/{teacherId}`.
7. Students browse or search the limited teacher directory and compare bio, grade fit, specialties, active load, and available capacity.
8. Students create `teacherStudentLinks/{teacherId_studentId}` with `status: "requested"`.
9. Teachers approve or decline requests from the dashboard. Approval changes the status to `active` and refreshes the teacher directory active-student count.
10. Student reading, memory, and logged-in activity actions create history records under `users/{studentId}/learningEvents`.
11. Active assigned teachers can read that student's event history, latest progress snapshot, and activity-completion summary.
12. Teachers can download a concise parent-facing report card for active assigned students using only the data visible in the dashboard.
13. Teacher compensation should be calculated from active assignment records in trusted backend code before real payouts are made.

The app prevents role switching after profile creation. Firebase Auth also prevents one Google email from becoming two separate accounts under normal email-provider linking rules. For stricter production enforcement, use Cloud Functions or a backend API to validate role creation, custom claims, paid teacher entitlements, and duplicate-email policies.

## Security Rules

Rules live in `firestore.rules`. They currently allow each signed-in Firebase user to read/update only:

```text
users/{theirUserId}
users/{theirUserId}/learning/progress
users/{theirUserId}/learningEvents
```

They also allow:

- Signed-in users to search a limited `teacherDirectory` with query limits.
- Teachers to create/update only their own private `teacherProfiles` when their user role is `teacher`.
- Students to create assignment requests for themselves.
- Students to update only the latest progress snapshot on their own requested or active assignment links.
- Teachers to approve or decline only their own assignment links.
- Active assigned teachers to read assigned student learning events.

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
