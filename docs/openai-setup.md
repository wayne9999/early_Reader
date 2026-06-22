# OpenAI Setup for ReadNest Insights

ReadNest should call OpenAI only from Firebase Functions. Do not put an OpenAI key in Vite, GitHub Pages variables, browser code, or Firestore documents.

## 1. Create an OpenAI API Key

1. Go to the OpenAI API dashboard:
   https://platform.openai.com/api-keys
2. Create a project-scoped API key for ReadNest.
3. Copy the key once. Do not paste it into chat, frontend code, or `.env.example`.

## 2. Store the Key in Firebase Functions

Use Cloud Shell or your local Firebase CLI:

```bash
firebase functions:secrets:set OPENAI_API_KEY --project readnest-f9c67
```

Paste the key when prompted.

## 3. Choose the Model

The OpenAI docs list the current recommended/latest model in the API documentation. Use a Firebase Functions runtime env value so we can change models without editing the frontend:

```text
READNEST_AI_MODEL=gpt-5.5
```

This value belongs in the Functions runtime environment, not as a `VITE_*` variable. If you want a lower-cost or lower-latency fallback later, add a second variable such as:

```text
READNEST_AI_FALLBACK_MODEL=
```

## 4. Provider Adapter Plan

The worker should keep this order:

1. Load recent `learningEvents`.
2. Build a compact deterministic learning summary.
3. Send only the compact summary to OpenAI.
4. Require structured JSON output.
5. Validate the response before writing Firestore.
6. Fall back to `rule-based-v1` if OpenAI is unavailable.

The provider response should include:

- strengths
- needsPractice
- likelyPatterns
- recommendedTeacherActions
- suggestedHomePractice
- evidence references
- confidence
- non-diagnostic disclosure

## 5. Safety Rules

- Never send card/payment data.
- Avoid sending child email addresses.
- Prefer student ID, grade band, goals, and compact practice statistics.
- Keep AI output labeled as instructional support, not diagnosis.
- Store `model`, `promptVersion`, `sourceEventCount`, and `createdAt` for auditability.

## 6. Deployment Checklist

After setting `OPENAI_API_KEY` and `READNEST_AI_MODEL`:

```bash
firebase deploy --only functions --project readnest-f9c67
```

Then request a teacher insight from the dashboard and confirm:

- an `aiAnalysisJobs` document is created
- `users/{studentId}/learningSummaries/current` is updated
- `users/{studentId}/aiInsights/{insightId}` is created
- the teacher dashboard shows the latest insight
