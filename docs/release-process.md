# ReadNest Release Process

## Environments

| Environment | Branch | Hosting | Purpose |
| --- | --- | --- | --- |
| Development | `main` | `https://wayne9999.github.io/early_Reader/` | Latest integrated code for QA and stakeholder review |
| Production | `production` | `https://myreadnest.org/` | Human-approved customer release |
| Firebase fallback | `production` artifact | `https://readnest-f9c67.web.app/` | Direct hosting health check and emergency fallback |

## Normal Release

1. Merge feature and bug-fix work into `main`.
2. Wait for **Deploy ReadNest Development** to pass.
3. Test the GitHub Pages development site.
4. Open **Actions > Promote Development to Production > Run workflow**.
5. Enter concise release notes.
6. Review the generated pull request from `main` into `production`.
7. Wait for **Production readiness** to pass.
8. Complete the checklist and merge the pull request.
9. **Deploy ReadNest Production** builds an immutable artifact from the exact production commit.
10. GitHub pauses the deployment at the protected `production` environment.
11. A required reviewer approves or rejects the deployment.
12. The approved artifact deploys to Firebase Hosting.
13. Smoke-test `myreadnest.org`.

No workflow pushes directly to `production`, and Firebase Hosting never deploys from `main`.

Development uses Stripe test mode and `testSubscriptions/{uid}`. Production uses Stripe live mode and `subscriptions/{uid}`. Both may use the same Firebase application backend, but billing functions, webhooks, customers, secrets, prices, and entitlement documents remain isolated.

## Approval Controls

The `production` branch:

- requires changes to arrive through a pull request
- requires the `Production readiness` status check
- blocks force pushes and deletion
- requires conversations to be resolved

The `production` environment:

- permits deployment only from the `production` branch
- requires a designated reviewer
- holds Firebase credentials until approval

Keep repository-level secrets available to the production deployment job only through its protected environment gate. A future hardening step can move the Firebase service-account secret from repository scope to the `production` environment.

## Backend Releases

Firestore rules and Firebase Functions remain separate from frontend promotion because backend changes can require migration and operational review.

Use **Deploy Firebase Backend** manually:

- `rules` for Firestore rules
- `functions` for functions
- `hosting` only for an emergency hosting redeploy
- `all` only when the release explicitly coordinates backend and frontend changes

Use **Deploy Live Stripe Billing** only from the protected production workflow after live Stripe values have been configured.

For production backend changes, record the deployed commit in the promotion pull request.

## Hotfix

1. Create the fix from `production`.
2. Test it and open a pull request back into `production`.
3. Let the same readiness and environment approval gates run.
4. Merge the hotfix back into `main` afterward to prevent branch drift.

## Rollback

Preferred rollback:

1. Revert the production pull request on the `production` branch.
2. Wait for validation.
3. Approve the resulting production deployment.

Emergency hosting rollback:

1. Open Firebase Hosting release history.
2. Roll back to the last known good release.
3. Immediately create a Git revert so source control matches production.

Never repair production only through the console without following with a source-controlled correction.
