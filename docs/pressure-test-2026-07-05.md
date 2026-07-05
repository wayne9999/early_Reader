# ReadNest Pressure Test — 2026-07-05

Full-stack adversarial review of the paid product path: frontend checkout flows, backend Stripe webhook handling, entitlement enforcement, Firestore security rules, and child-data consent handling. All findings below were verified in code, fixed, and locked in with tests in the same change.

## Verification status after this pass

| Check | Result |
| --- | --- |
| `npm run check` (app typecheck) | Pass |
| `npm run test` (unit/integration) | 27 files, 95 tests, all pass |
| `npm run test:e2e` (Playwright) | 7/7 pass |
| `npm run build` (production build) | Pass |
| `functions` typecheck | Pass |
| `npm audit --audit-level=moderate` | 0 vulnerabilities |
| `npm run validate:content` | Pass (grade-tag warning noted below) |

## Findings fixed in this pass

### P0 — Revenue path

1. **Checkout buttons could silently do nothing (popup blockers).**
   `SubscriptionPrompt`, `SubscriptionManagement`, and both in-app paywalls opened Stripe checkout with `window.open(...)` *after* an `await`. Browsers (Safari/iOS especially) block programmatic popups that are not in the direct call stack of a user gesture, so the primary upgrade button could fail with no feedback. The two RootApp paywalls also had no error handling at all — a rejected checkout call was an unhandled promise rejection and a dead button.
   **Fix:** all checkout entry points now redirect the current tab with `window.location.assign(url)` (matching the Support page, which already did this) through a shared `UpgradeCheckoutButton` component with busy and error states. Same-tab redirect also means returning from Stripe reloads the app and refetches trusted subscription state.

2. **Paid access was not revoked in auth claims after refunds, disputes, or failed payments.**
   The webhook wrote `subscriptions/{uid}` on `invoice.payment_failed`, `charge.refunded`, and `charge.dispute.created`, but only `customer.subscription.*` events refreshed Firebase custom claims. A refunded or disputing customer kept `hasFamilyPlus`/`hasTeacherPro = true` in their token until an unrelated subscription event arrived.
   **Fix:** every live-mode subscription write now flows through `syncSubscriptionClaims`, so claims track Firestore on all status transitions. Claim-sync failures are logged, never dropped silently.

3. **Out-of-order Stripe webhooks could resurrect canceled subscriptions.**
   Stripe does not guarantee event ordering, and the handler wrote whatever event arrived last. A delayed `customer.subscription.updated (active)` arriving after `customer.subscription.deleted` would re-grant paid access.
   **Fix:** subscription writes now run in a transaction guarded by `lastStripeEventCreated`; an event older than the last applied event is ignored.

4. **A partial refund canceled the whole subscription.**
   `charge.refunded` fires for partial refunds too; the handler unconditionally set status `canceled`. A goodwill $1 partial refund would have revoked a paying family's access.
   **Fix:** only fully refunded charges (`charge.refunded === true`) cancel access; partial refunds are logged and ignored.

5. **A non-subscription checkout could downgrade an active subscriber.**
   The `checkout.session.completed` fallback path wrote `tier: "free", status: "checkoutStarted"` over the subscription document.
   **Fix:** the fallback no longer touches `tier` and skips the write entirely when the existing subscription is active.

### P0 — Children's data compliance

6. **The nightly AI scheduler asserted parental consent it never checked.**
   `enqueueDailyInsightJobs` queued AI insight jobs with `consentAccepted: true` for every actively-assigned student, while the interactive paths correctly require consent. For a COPPA-sensitive product this is not a defensible default.
   **Fix:** the scheduler now reads each student's user document and only queues jobs where `parentConsentAccepted` or `aiRecommendationsConsentAccepted` is true; skipped students are counted in the operational log.

### P1 — Firestore rules

7. **Students could re-queue an already-assigned placement.** The placement-queue update rule allowed flipping `status` from `assigned` back to `unassigned`, letting a second teacher claim the same student (duplicate active links, distorted capacity counts). Updates on an `assigned` placement are now denied client-side; assignment transitions stay backend-only.

8. **Invite acceptance could rewrite invite terms.** The student accept path on `teacherInvites` did not restrict changed fields, so an accepting student could also alter `code`, `autoApprove`, or `expiresAt`. Acceptance is now limited to `status`, `acceptedBy`, `acceptedAt`, `updatedAt`, `updatedBy`.

### P1 — UX / robustness

9. **`SubscriptionPrompt.startPaidPlan` had an unguarded profile write** before its try/catch — an offline or rules failure crashed the flow before checkout. It is now inside the error boundary.

10. **Account page can now refresh subscription status on demand.** After returning from Stripe there can be a short webhook delay; a "Refresh status" button on the Account page refetches the trusted subscription document instead of requiring a page reload.

11. **Playwright could not run in remote/CI sandboxes** with a pre-installed Chromium that doesn't match the pinned browser revision. `playwright.config.mjs` now honors `PLAYWRIGHT_CHROMIUM_PATH` (e.g. `/opt/pw-browsers/chromium` in Claude Code remote sessions).

## Tests added

- `src/features/account/UpgradeCheckoutButton.test.tsx` — same-tab redirect and visible error handling.
- `src/services/functionsStripeContract.test.ts` — five new contract assertions: event-order guard, claim sync on downgrades, partial-refund guard, active-subscription protection, scheduler consent filter.
- `src/services/firestoreRulesPrivacy.test.ts` — two new rules assertions: assigned-placement lock, invite-acceptance field restriction.

## Deliberately not changed

- **Client-side gating of static paid activities** (Sentences, Story Steps, Word Garden): a technical user could reach this static content by manipulating client state. The expensive assets (ElevenLabs voice, AI insights) are enforced server-side; gating static rounds server-side is not worth the complexity at this stage. Revisit if premium content becomes substantial.
- **Demo-mode entitlement fallbacks** (`source === "demo"`): only reachable when Firebase is not configured, which `firebase.ts` forbids in production builds.

## Remaining launch risks — follow-up pass (same day)

Items 1–4 below were closed in the follow-up commit on this branch:

1. **Stripe webhook registration + test event** → automated. `scripts/register-stripe-webhook.mjs` plus the **Register Stripe Webhook** workflow register the endpoint via the Stripe API, store the signing secret in Firebase, redeploy the webhook function, and (test mode) fire a `checkout.session.completed` event and check the function logs. One workflow run per mode is all that remains; see `docs/stripe-setup.md`.
2. **App Check** → enforced by default in production. The functions default `enforceAppCheck` to on when `READNEST_ENVIRONMENT=production` (explicit `READNEST_ENFORCE_APP_CHECK=false` is a temporary rollback switch), the production deploy workflow default flipped to `true`, and production builds now fail validation without `VITE_FIREBASE_APP_CHECK_SITE_KEY`. Action required before the next production deploy: register the reCAPTCHA v3 key and set `PROD_VITE_FIREBASE_APP_CHECK_SITE_KEY`.
3. **Invite acceptance/revocation** → complete. New `acceptTeacherInvite` backend callable validates the code (active, unexpired, single-use), enforces teacher capacity for auto-approve invites, creates the assignment link transactionally, and consumes the invite. Students redeem codes on Find Teacher; teachers revoke unused codes from their dashboard.
4. **Data-deletion fulfillment** → implemented. Admin-only `fulfillDataDeletion` callable deletes the full user subtree, assignment links, invites, child profiles, analytics events, and the auth account; resolves the originating support case; retains billing records deliberately. Operational steps in `docs/data-deletion-runbook.md`.

Still open (product/content work, not launch blockers):

5. **Content grade tags** are missing (`validate:content` warning) — needed before scaling paid content packs.
6. **Teacher certification verification** is stored but not operationally verified against state agencies.
