# AI Learning Workflow

ReadNest uses backend-only AI workflow boundaries. The React app never calls an AI provider and never stores provider secrets.

## Current Implementation

- Student activity events are written to `users/{studentId}/learningEvents/{eventId}`.
- Teachers can request a backend insight with the `requestStudentInsight` callable function.
- The callable creates an `aiAnalysisJobs/{jobId}` document.
- `processAiAnalysisJob` runs asynchronously when a job is created.
- The worker loads recent learning events, creates a compact deterministic summary, and writes:
  - `users/{studentId}/learningSummaries/current`
  - `users/{studentId}/aiInsights/{insightId}`
- `enqueueDailyInsightJobs` creates scheduled jobs for active teacher-student assignments each night.

The default fallback insight engine is `rule-based-v1`. When `OPENAI_API_KEY` is available in Firebase Functions, the worker calls OpenAI with the compact summary and stores the model-backed structured result. If the model call fails, the worker records the provider error on the job and writes the rule-based fallback insight instead.

## Budget Guard

Model calls are protected by a backend monthly budget guard before OpenAI is called:

- The worker reserves an estimated cost in `aiBudget/monthly/months/{yyyy-mm}`.
- The React app cannot read or write `aiBudget`; Firestore rules keep it backend-only.
- `READNEST_AI_WARNING_LIMIT_USD` marks jobs as `openai-warning` so teachers see that the app is near the budget threshold.
- `READNEST_AI_MONTHLY_LIMIT_USD` is the hard cap. Once reached, jobs use `budget-fallback` and still write a rule-based insight.
- `READNEST_AI_ESTIMATED_COST_PER_INSIGHT_USD` gives each insight a conservative reservation so the cap works even when exact provider pricing is not configured.
- Optional token price variables can reconcile estimated spend after the Responses API returns token usage.

The teacher dashboard shows the provider mode and budget status. In test environments, keep the cap low, such as `$10` warning and `$15` hard limit. For production, use provider billing alerts plus this app-level guard.

## Future Model-Backed Provider

The provider adapter stays behind the worker only:

```text
Student events -> deterministic summary -> AI provider adapter -> structured insight JSON -> Firestore
```

The model payload should include only compact learning summaries:

- skill-level counts
- accuracy by area
- top missed items
- top mastered items
- recent trend window
- grade band and reading goal when available

Do not send raw all-time event history, student email, payment data, or unnecessary child-identifying details.

## Trigger Strategy

- Scheduled batch: nightly for active students with teacher links.
- Teacher request: on-demand, gated by auth, assignment, consent, and subscription policy.
- Threshold trigger: future enhancement after enough new practice events are collected.

## Security Rules

- Clients cannot create or update AI jobs, summaries, or insights directly.
- A student can read only their own insight records.
- A teacher can read only assigned students through `teacherStudentLinks/{teacherId_studentId}` with `status == "active"`.
- Admin review should use admin-controlled backend tooling, not broad client reads.

## Teacher-Facing Rules

AI output must be presented as instructional support, not a diagnosis. Teacher recommendations should include evidence from recent practice and should be short enough to act on during a small-group lesson.
