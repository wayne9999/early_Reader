# ReadNest Personalization

ReadNest uses Firebase as the personalization backbone, but not as a single
black-box recommendation product.

## What Firebase Provides

- Firebase Auth identifies the learner.
- Firestore stores the student profile, parent consent, grade level, reading
  goal, progress, and learning events.
- Cloud Functions can process learning events into AI or rule-based coach
  insights without exposing raw student history or API keys in the browser.
- Firestore rules keep each student history private and allow assigned teachers
  to read only the students linked to them.

Firebase Remote Config could later tune thresholds, copy, or feature flags, but
the actual learning path should remain grounded in Firestore learning evidence
and backend-generated insights.

## Current Experience

Student setup now captures:

- grade level: Kindergarten, Grade 1, or Grade 2
- reading goal: confidence, phonics, sight words, or fluency
- preferred practice time

The student dashboard builds a personalized path from:

- the saved student profile
- recent `learningEvents`
- known words and local/cloud progress
- latest Learning Coach / AI insight when available

The five logged-in activities keep all ten rounds, but the round order can move
recent missed targets earlier. This makes each learner's practice feel different
without hiding content or changing the overall activity rules.

## Data Boundary

The frontend can derive a lightweight personalized path for immediate feedback.
Trusted subscription state, teacher access, and AI-generated insight authority
stay in Firebase/Cloud Functions.

Learning events are still the core evidence:

```text
users/{studentId}/learningEvents/{eventId}
users/{studentId}/learningCoachState/current
users/{studentId}/learningSummaries/current
users/{studentId}/aiInsights/{insightId}
```

## Future Improvements

- Add a parent profile editor for changing grade level and goals.
- Use Remote Config for recommendation thresholds.
- Store a backend-authored `personalizationPlans/{studentId}` document if the
  client-side plan becomes too complex.
- Add teacher-adjusted goals so teacher interventions can influence the next
  best activity.
