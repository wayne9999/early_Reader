# ReadNest Release QA - June 25, 2026

## Test Scope

The live GitHub Pages application and Firebase test backend were exercised with newly created teacher and student accounts.

Completed journeys:

- Teacher email/password signup and role creation
- Teacher Pro Stripe sandbox checkout and trusted webhook entitlement
- Student email/password signup with parent consent
- Student teacher selection and teacher approval
- Student holding-space placement and teacher claim
- Teacher access to assigned-student learning history
- Student dashboard event history and recommendations
- Teacher report-card download trigger
- Signed-in support request submission
- Public donation Stripe sandbox checkout
- Free/premium route gating
- Reading word/sound/sentence synchronization
- Ten-round Rhyme Rocket completion
- Six-pair Memory board completion and New Game reset
- Mobile menu and protected-route browser automation

## Defects Found And Fixed

| Severity | Defect | Resolution |
| --- | --- | --- |
| Critical | Authenticated subscription checkout could fall back to a static Payment Link that lacked trusted Firebase identity metadata. | Authenticated subscriptions now require the backend-created Checkout Session and fail visibly if it is unavailable. |
| Critical | Billing management opened a malformed or expiring static URL. | Account billing now requests a fresh authenticated Stripe Customer Portal session from Firebase Functions. |
| High | Support showed Family Plus and Teacher Pro to every role and used raw Payment Links. | Signed-in students see Family Plus only; teachers see Teacher Pro only; checkout uses the trusted backend. |
| High | Teacher approval changed only the link and left student placement stale. | Approval/decline moved to a transactional backend callable that updates placement, capacity, and competing requests. |
| High | Teacher roster displayed demo students while real data loaded. | Production roster now shows an honest loading or empty state and only renders assigned Firestore students. |
| High | Successful reading actions also logged `word_skipped`. | Known-word and completed-sentence actions now advance without writing a false skip event. |
| Medium | Completed ten-round activities could remain locked after returning. | Every activity now resets on route change and exposes a Play Again action. |
| Medium | Student dashboard showed a four-activity goal while progress storage capped at three. | Dashboard and sidebar now consistently use a three-activity daily goal. |
| Medium | Teacher clients could directly change assignment status and active-student counts. | Assignment status is backend-controlled and Firestore rules lock authoritative counts. |
| Medium | New placement records exposed student email addresses to the holding queue. | New placement records omit email; the backend retrieves it only when an assignment is created. |

## Verified Behaviors

- A completed Teacher Pro sandbox checkout produced `Teacher Pro active` after Stripe webhook processing.
- The claimed student's 25 recorded interactions, Rhyme Rocket completion, progress, and learning-coach output were visible to the assigned teacher.
- Free students were blocked from Story Steps and directed to Family Plus.
- Support submission returned a saved confirmation through the rate-limited callable.
- Memory counters reached 6 turns and 6 of 6 matches, then reset to zero with New Game.
- Public donation checkout opened the configured Stripe sandbox donation product.

## Remaining Work

- Stripe Checkout remained visually on `Processing` during browser-agent automation even though the webhook completed and entitlement became active. Repeat once manually in a normal browser to distinguish Stripe anti-automation behavior from an end-user issue.
- Student entry and acceptance of teacher invite codes still needs a complete user interface.
- Teacher certification/background-check verification still needs an admin review workflow and connection to state-specific verification sources.
- Authenticated Firebase Emulator tests should supplement the current rules-text tests.
- App Check enforcement should be enabled only after valid-request metrics are visible in Firebase.
- Replace the temporary Resend sender with a verified ReadNest domain.
