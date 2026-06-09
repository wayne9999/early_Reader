# Implementation Plan

## Goal

Create a functional MVP that helps early elementary students improve reading fluency and memory through short, repeatable practice activities, while giving caregivers and teachers clear visibility into progress.

## Audience

- Primary users: kindergarten through grade 2 children.
- Supporting users: parents, caregivers, tutors, teachers, and admins.

## Design Principles

- Keep activities short and predictable.
- Use large text and high-contrast controls.
- Prefer encouragement through progress visibility instead of scores or penalties.
- Use demo/local fallback until auth and database credentials are configured.
- Store content separately from feature logic so lessons can expand safely.
- Keep child data access role-based and auditable.
- Treat AI as teacher decision support, not diagnosis.

## MVP Scope

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
   - Caregiver next-step tips.

4. Teacher/admin dashboard
   - Classroom roster.
   - Student-level strengths and growth areas.
   - Intervention plan suggestions.
   - AI-analysis boundary that can later move to a secure backend.

## Technical Choices

- React, TypeScript, and Vite for scalable frontend structure.
- Firebase Firestore-ready repository with browser `localStorage` fallback.
- Auth0-ready social login boundary for Google, Facebook, and Instagram.
- Browser `SpeechSynthesis` for read-aloud support.
- Modular feature folders and service boundaries for long-term maintainability.

## Scaling Path

- Add Auth0-to-Firebase custom-token bridge or switch to Firebase Auth as primary auth.
- Replace demo classroom data with Firestore classroom enrollment records.
- Move `content.ts` to CMS-managed JSON.
- Add route-based navigation when the app grows beyond three views.
- Add backend AI endpoint for evidence-based analysis and teacher recommendations.
- Store AI outputs with model, source data window, and timestamps for auditability.
- Add automated browser tests around learning flows.
- Wrap the web app in Capacitor or React Native WebView if mobile app distribution becomes important.

## Privacy Notes

The app stores progress locally unless Firebase and authenticated user wiring are configured. Production teacher/admin and AI features must use consent-aware data collection, role-based access, and backend-only AI calls so API keys and student data are not exposed in the browser.
