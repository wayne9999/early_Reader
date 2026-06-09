# Implementation Plan

## Goal

Create a functional MVP that helps early elementary students improve reading fluency and memory through short, repeatable practice activities.

## Audience

- Primary users: kindergarten through grade 2 children.
- Supporting users: parents, caregivers, tutors, and teachers.

## Design Principles

- Keep activities short and predictable.
- Use large text and high-contrast controls.
- Prefer encouragement through progress visibility instead of scores or penalties.
- Avoid account creation in the MVP to reduce privacy and setup friction.
- Store content separately from feature logic so lessons can expand safely.

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

## Technical Choices

- Static HTML, CSS, and JavaScript modules for a zero-install MVP.
- Browser `localStorage` for progress persistence.
- Browser `SpeechSynthesis` for read-aloud support.
- Modular source layout to keep future migration straightforward.

## Scaling Path

- Replace `progressStore.js` with a server-backed repository.
- Move `content.js` to CMS-managed JSON.
- Add route-based navigation when the app grows beyond three views.
- Add automated browser tests around learning flows.
- Wrap the web app in Capacitor or React Native WebView if mobile app distribution becomes important.

## Privacy Notes

The MVP stores progress only in the user's browser. It does not transmit child data to a server.
