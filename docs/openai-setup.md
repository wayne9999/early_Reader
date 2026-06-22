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

## 4. Set the Budget Guard

ReadNest has an app-level budget guard in Firebase Functions. This is separate from OpenAI billing controls and prevents the worker from making more model calls after the configured monthly cap.

Recommended test values:

```text
READNEST_AI_WARNING_LIMIT_USD=10
READNEST_AI_MONTHLY_LIMIT_USD=15
READNEST_AI_ESTIMATED_COST_PER_INSIGHT_USD=0.05
READNEST_AI_INPUT_COST_PER_1M_USD=0
READNEST_AI_OUTPUT_COST_PER_1M_USD=0
```

The estimated cost per insight is the primary test-phase guard. Token cost variables are optional and should be filled from the current OpenAI pricing page before production if you want exact reconciliation after each response. When the hard cap is reached, the backend stores `provider: "budget-fallback"` on the job and writes a rule-based insight instead.

## 5. Provider Adapter Plan

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

## 6. Safety Rules

- Never send card/payment data.
- Avoid sending child email addresses.
- Prefer student ID, grade band, goals, and compact practice statistics.
- Keep AI output labeled as instructional support, not diagnosis.
- Store `model`, `promptVersion`, `sourceEventCount`, and `createdAt` for auditability.

## 7. Deployment Checklist

After setting `OPENAI_API_KEY`, `READNEST_AI_MODEL`, and the budget variables:

```bash
firebase deploy --only functions --project readnest-f9c67
```

Then request a teacher insight from the dashboard and confirm:

- an `aiAnalysisJobs` document is created
- `users/{studentId}/learningSummaries/current` is updated
- `users/{studentId}/aiInsights/{insightId}` is created
- the teacher dashboard shows the latest insight
- the job document shows `provider`, `budget`, token counts when available, and any provider error/fallback reason
