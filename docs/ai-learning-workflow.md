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

The current insight engine is `rule-based-v1`. It is intentionally useful without an AI provider key and becomes the fallback when model calls are unavailable.

## Future Model-Backed Provider

Add a provider adapter behind the worker only:

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
