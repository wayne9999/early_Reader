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

Optional support email automation secret:

```bash
firebase functions:secrets:set RESEND_API_KEY
```

Future AI provider runtime value:

- `READNEST_AI_MODEL`
- `READNEST_AI_WARNING_LIMIT_USD`
- `READNEST_AI_MONTHLY_LIMIT_USD`
- `READNEST_AI_ESTIMATED_COST_PER_INSIGHT_USD`
- `READNEST_AI_INPUT_COST_PER_1M_USD`
- `READNEST_AI_OUTPUT_COST_PER_1M_USD`

Runtime environment values:

- `STRIPE_FAMILY_PLUS_PRICE_ID`
- `STRIPE_TEACHER_PRO_PRICE_ID`
- `READNEST_APP_BASE_URL`
- `SUPPORT_NOTIFICATION_EMAIL`
- `SUPPORT_FROM_EMAIL`

## Production Authority

- Firebase Auth is the source of user identity.
- `users/{uid}` stores profile and locked role.
- `subscriptions/{uid}` stores paid access state from Stripe webhook/backend only.
- Firestore rules prevent clients from writing subscription authority.
- Teacher access to student history requires an active `teacherStudentLinks/{teacherId_studentId}` record.
- AI insight jobs and generated recommendations are backend-authored only. Teachers can read insight output only for actively assigned students.
- AI budget records under `aiBudget/**` are backend-only. If the monthly cap is reached, the backend uses the rule-based fallback instead of calling OpenAI.
- Support requests are stored in `supportCases/{caseId}`. The backend support worker writes AI summary fields and a Firebase Console detail link to the same document.
- Operational logs are written to Cloud Logging and backend-authored `systemLogs/{logId}` documents. Client users cannot write operational logs; admins can read them through Firestore rules.

## Observability Queries

Use Cloud Logging for runtime root-cause analysis:

```text
resource.type="cloud_run_revision"
jsonPayload.service="readnest-functions"
jsonPayload.eventName="support_case_processing_failed"
```

For a specific support ticket or AI job, filter by the correlation id:

```text
jsonPayload.correlationId="SUPPORT_OR_JOB_ID"
```

Use Firestore `systemLogs` for app-level operational history:

- `eventName == "support_case_received"`
- `eventName == "support_case_summarized"`
- `eventName == "support_email_failed"`
- `eventName == "ai_provider_fallback"`
- `eventName == "ai_job_failed"`

Each log stores severity, event name, message, resource type/id, correlation id, and privacy-safe metadata. Full support messages stay in `supportCases/{caseId}`, not in logs.

## Launch Blocks

- Legal review is required before child-directed public launch.
- Stripe webhooks must be deployed and tested before paid acquisition.
- Parent consent and deletion workflow need operational ownership.
- Demo/localStorage fallback should not be treated as production authority.
