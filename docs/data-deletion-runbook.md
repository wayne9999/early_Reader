# Data Deletion Runbook

How to fulfill a family's or teacher's data-deletion request end to end. The
deletion itself is automated by the `fulfillDataDeletion` Firebase callable;
this runbook covers the human steps around it.

## What the callable deletes

For the target `userId`:

- The full `users/{userId}` subtree: profile, learning progress, learning
  events, learning summaries, AI insights, learning coach state.
- `studentPlacementQueue/{userId}`, `teacherProfiles/{userId}`,
  `teacherDirectory/{userId}`.
- All `teacherStudentLinks` where the user is the student or the teacher.
- All `teacherInvites` created by the user.
- All `childProfiles` whose `parentUid` is the user.
- All `analyticsEvents` recorded for the user.
- The Firebase Auth account.

## What is intentionally retained

- `subscriptions/{userId}` / `testSubscriptions/{userId}`: financial records
  tied to Stripe transactions. Subscription **cancellation** happens in Stripe
  (Customer Portal or Dashboard), not through data deletion. Confirm the
  subscription is canceled in Stripe before deleting the account, or the
  customer keeps getting charged for a product they can no longer open.
- `supportCases` for the user, including the deletion request itself: the
  deletion case is the audit record that the request was received and
  fulfilled. The callable marks it `resolved` / `dataDeleted`.
- `systemLogs` operational entries, per standard log retention.

## Fulfillment steps

1. **Verify the request.** Deletion requests arrive as `supportCases` with
   type `dataDeletion` (Support page → "Data deletion"). Confirm the request
   comes from the account owner: reply to the case's `contactEmail` and get
   a confirmation from the email on the Firebase Auth account. For child
   accounts, the parent/caregiver who holds the account credentials makes the
   request.
2. **Check billing first.** If the account has an active subscription, cancel
   it in the Stripe Dashboard (or have the family cancel via Customer Portal)
   before deleting. Note the cancellation in the support case.
3. **Call the function as an admin.** `fulfillDataDeletion` requires the
   caller to be signed in with a ReadNest account whose `users/{uid}.role` is
   `admin`, and requires `confirm` to equal the target `userId`:

   ```js
   // From an admin session in the app's browser console, or an admin tool:
   import { getFunctions, httpsCallable } from "firebase/functions";

   const fulfill = httpsCallable(getFunctions(undefined, "us-central1"), "fulfillDataDeletion");
   const result = await fulfill({
     userId: "TARGET_USER_ID",
     caseId: "SUPPORT_CASE_ID",   // optional; marks the case resolved
     confirm: "TARGET_USER_ID"    // must match userId exactly
   });
   console.log(result.data);
   ```

   The call is rate-limited (5 per hour per admin) and refuses to delete the
   calling admin's own account.
4. **Confirm completion.** The response lists deleted collections. The
   operational log records `data_deletion_fulfilled` in `systemLogs`. If the
   auth-account step fails mid-way, re-run the call — every step is safe to
   repeat.
5. **Close the loop with the requester.** Email the contact address that the
   deletion completed, what was removed, and what was retained (billing
   records) and why. Target turnaround: 30 days from a verified request,
   consistent with the privacy policy.

## Notes

- The callable is idempotent: deletes of already-deleted documents are no-ops
  and `auth/user-not-found` is tolerated, so partial failures are recovered by
  re-running.
- There is deliberately no scheduled auto-deletion: a human verifies identity
  and billing state before the irreversible step.
