# Implementation Plan

## Goal

Create a personalized reading platform that helps early elementary students improve reading fluency and memory through short, repeatable practice activities, while giving caregivers and teachers clear visibility into progress and next steps.

## Audience

- Primary users: kindergarten through grade 2 children.
- Supporting users: parents, caregivers, tutors, teachers, and admins.

## Design Principles

- Keep activities short, predictable, and personalized by grade, goal, and recent practice.
- Use large text and high-contrast controls.
- Prefer encouragement through progress visibility instead of scores or penalties.
- Use demo/local fallback only for development; production authority belongs in Firebase and backend services.
- Store content separately from feature logic so lessons can expand safely.
- Keep child data access role-based and auditable.
- Treat AI as teacher decision support, not diagnosis.

## Current Product Scope

1. Reading practice
   - Sight word recognition.
   - Phonics blending.
   - Short sentence reading.
   - Read-aloud support.

2. Memory practice
   - Matching cards with familiar school and home concepts.
   - Turn counter and matched-pair counter.
   - Completion saved to local progress.

3. Progress
   - Known words.
   - Reading sessions.
   - Memory wins.
   - Daily goal progress.
   - Personalized caregiver next-step tips.

4. Teacher/admin dashboard
   - Classroom roster.
   - Student-level strengths and growth areas.
   - Intervention plan suggestions.
   - Backend AI-analysis boundary with rule-based fallback and auditability.

## Technical Choices

- React, TypeScript, and Vite for scalable frontend structure.
- Firebase Auth and Firestore repositories with browser `localStorage` fallback for development.
- Social login boundary for supported providers, with incomplete providers clearly labeled.
- Browser `SpeechSynthesis` for read-aloud support.
- Modular feature folders and service boundaries for long-term maintainability.

## Scaling Path

- Continue hardening Firebase Auth as the primary production auth path.
- Replace remaining demo classroom fallback data with Firestore enrollment records.
- Move `content.ts` to CMS-managed JSON.
- Add route-based navigation when the app grows beyond three views.
- Expand backend AI workflow for evidence-based analysis and teacher recommendations.
- Store AI outputs with model, source data window, and timestamps for auditability.
- Add automated browser tests around learning flows.
- Wrap the web app in Capacitor or React Native WebView if mobile app distribution becomes important.

## Privacy Notes

The app stores progress locally unless Firebase and authenticated user wiring are configured. Production teacher/admin and AI features must use consent-aware data collection, role-based access, and backend-only AI calls so API keys and student data are not exposed in the browser.
