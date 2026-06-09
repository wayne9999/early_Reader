# ReadNest

ReadNest is a small web MVP for children in kindergarten through grade 2 who are practicing early reading and age-appropriate memory skills.

## What The MVP Includes

- Reading practice with level-based sight words, phonics blending, and short sentences.
- Browser read-aloud support using the built-in SpeechSynthesis API.
- A memory matching game using school-ready concepts like healthy habits, kind words, and classroom routines.
- Local progress tracking for known words, reading sessions, memory wins, and daily activity goals.
- A caregiver progress screen with simple next-step recommendations.
- Responsive layout for desktop, tablet, and phone-sized screens.

## Run It

Open `index.html` directly in a browser, or run a static server:

```bash
npm run start
```

Then visit `http://localhost:4173`.

No dependency install is required for the app itself. The `start` script uses `npx serve` only if you want a local server.

## Quality Check

```bash
npm run check
```

This validates the JavaScript files with Node's syntax checker.

## Architecture

```text
src/
  app.js                         App shell, navigation, progress wiring
  data/content.js                Reading levels, memory cards, caregiver tips
  features/readingPractice.js    Sight word, phonics, and sentence flow
  features/memoryGame.js         Matching game flow
  features/progressDashboard.js  Caregiver-facing progress view
  features/speech.js             Read-aloud adapter
  services/progressStore.js      Local persistence and progress mutations
  styles.css                     Responsive product UI
```

The project is intentionally modular so the MVP can later grow into:

- A React, Vue, or mobile shell without rewriting the learning content.
- A backend progress API replacing `localStorage`.
- Teacher-managed content packs.
- Multi-child profiles and classroom reporting.
- Accessibility and assessment instrumentation.

## Product Plan

### MVP

- Short reading practice loops for young attention spans.
- Read-aloud support and large typography.
- Memory matching with familiar, developmentally appropriate concepts.
- Local progress only, avoiding accounts and privacy complexity.

### Next Milestone

- Add child profiles.
- Add a content editor for caregivers or teachers.
- Track accuracy separately from completion.
- Add printable practice sheets.
- Add offline-first PWA support.

### Long-Term Direction

- Use a backend API for authenticated progress sync.
- Introduce adaptive practice based on missed words.
- Support multiple languages and dialect-aware pronunciation.
- Add teacher dashboards with classroom-level insights.
- Add rigorous accessibility testing and age-appropriate usability testing.
