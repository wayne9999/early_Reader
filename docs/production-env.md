# Production Environment

## GitHub Pages Variables

Configure these under:

```text
GitHub repository > Settings > Secrets and variables > Actions > Variables
```

- `VITE_BASE_PATH=/early_Reader/`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_STRIPE_DONATION_LINK`
- `VITE_STRIPE_FAMILY_PLUS_LINK`
- `VITE_STRIPE_TEACHER_PRO_LINK`
- `VITE_STRIPE_CUSTOMER_PORTAL_LINK`
- `VITE_SUPPORT_EMAIL`

Vite variables are public at build time. Never put Stripe secret keys, Firebase service account keys, or webhook secrets in `VITE_*` variables.

## Firebase Functions Secrets

Configure these with Firebase CLI:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

Future AI provider secret, only when model-backed insights are enabled:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

Runtime environment values:

- `STRIPE_FAMILY_PLUS_PRICE_ID`
- `STRIPE_TEACHER_PRO_PRICE_ID`
- `READNEST_APP_BASE_URL`

## Production Authority

- Firebase Auth is the source of user identity.
- `users/{uid}` stores profile and locked role.
- `subscriptions/{uid}` stores paid access state from Stripe webhook/backend only.
- Firestore rules prevent clients from writing subscription authority.
- Teacher access to student history requires an active `teacherStudentLinks/{teacherId_studentId}` record.
- AI insight jobs and generated recommendations are backend-authored only. Teachers can read insight output only for actively assigned students.

## Launch Blocks

- Legal review is required before child-directed public launch.
- Stripe webhooks must be deployed and tested before paid acquisition.
- Parent consent and deletion workflow need operational ownership.
- Demo/localStorage fallback should not be treated as production authority.
