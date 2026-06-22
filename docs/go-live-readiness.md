# ReadNest Go-Live Readiness

Status labels:

- Completed: implemented or documented enough for a controlled beta.
- Needs Work: partially implemented, usable for testing, not enough for broad launch.
- Blocked: requires external setup, legal review, paid services, or credentials.

## Product And UX

| Area | Status | Notes |
| --- | --- | --- |
| Free starter value | Completed | Reading, Memory, Rhymes, Sounds, and Sentences remain available to free signed-in students. |
| Premium student value | Needs Work | Story Steps and Word Garden are gated; printable plans and premium packs need full content and export flows. |
| Teacher workflow | Needs Work | Student requests, holding-space claims, approval, dashboards, reports, and invite-code creation exist. Invite acceptance/revocation admin tools need completion. |
| Parent workflow | Needs Work | Student dashboard, progress summary, and parent consent storage exist. Multi-child parent account management needs a full child profile UI. |
| Onboarding | Needs Work | Account role selection exists. Grade, reading goal, placement/checkpoint, and personalized starting path need completion. |
| Mobile UX | Completed | Current responsive layout and hamburger menu are tested with Playwright smoke coverage. |
| Accessibility | Needs Work | Semantic labels and tap targets exist in core flows. Needs full keyboard/screen-reader audit and contrast review before public launch. |
| Retention | Needs Work | Streak/badge concepts are not fully implemented. Weekly reminder/email hooks are documented but not connected. |

## Auth, Roles, And Security

| Area | Status | Notes |
| --- | --- | --- |
| Firebase Auth production path | Completed | Firebase Auth is preferred when env values are configured. Demo/Auth0 behavior is fallback only. |
| Incomplete social providers | Completed | Instagram sign-in is visibly marked as coming later under Firebase. |
| Role lock | Completed | Firestore rules prevent users from changing profile role after creation. |
| Teacher/student separation | Completed | Firestore rules restrict student data to the owner and active assigned teacher. |
| Admin role | Needs Work | Rules include admin checks, but admin provisioning must be done by trusted backend/custom claims. |
| Error boundaries | Needs Work | Friendly loading/error states exist in places; a global React error boundary still needs adding. |
| XSS/export safety | Completed | Report exports escape user-visible text. Avoid `dangerouslySetInnerHTML` in app UI. |
| CSP | Needs Work | See `docs/deployment.md` for recommended CSP. GitHub Pages has limited header support without a proxy/custom host. |

## Billing And Entitlements

| Area | Status | Notes |
| --- | --- | --- |
| Stripe-hosted payment | Completed | Backend-created Checkout Sessions are preferred for subscriptions, with Payment Links as fallback/donation support. Card data never touches the app. |
| Trusted subscription state | Completed | Frontend now reads `subscriptions/{uid}`. Missing subscription docs fail closed for paid access in Firebase mode. |
| Stripe webhook backend | Needs Work | Firebase Functions deploy with secrets succeeds. Stripe Dashboard webhook endpoint and test-event verification still need final confirmation. |
| Billing portal | Needs Work | Callable `createBillingPortalSession` exists and deploys. Account UI still needs to prefer the callable over any durable external portal link. |
| Failed payment states | Completed | Past-due/canceled states show billing guidance and lock premium access. |
| Refund/dispute handling | Needs Work | Webhook scaffold marks refund/dispute states; operations policy and reconciliation need testing. |

## Firestore And Data

| Area | Status | Notes |
| --- | --- | --- |
| Rules hardening | Completed | Subscriptions are backend-write-only; teacher access is assignment-bound; analytics/support paths are constrained. |
| Placement queue | Completed | Students can enter a teacher-visible holding queue; teachers claim through a backend function that enforces role and capacity. |
| LocalStorage authority | Needs Work | LocalStorage remains a development fallback. Production launch should require Firebase env values and hide demo fallback. |
| Audit fields | Needs Work | Core writes include timestamps. A full audit policy should standardize `createdBy`, `updatedBy`, `status`, and archive fields everywhere. |
| Soft delete/archive | Needs Work | Some types support archive/status fields, but full archive flows for links/reports/profiles need admin UI. |
| Indexes | Needs Work | Current queries may need Firestore composite indexes as traffic grows; see `docs/firebase-setup.md`. |

## Analytics, SEO, And Marketing

| Area | Status | Notes |
| --- | --- | --- |
| Privacy-conscious analytics | Completed | `trackProductEvent` strips child-identifying metadata and stores event names only for signed-in Firebase users. |
| Business metrics dashboard | Blocked | Needs backend aggregation for MRR, churn, active users, AI spend, and feature usage. |
| SEO metadata | Needs Work | Static metadata exists for GitHub Pages. Custom domain, canonical URLs, and prerender/SSR should be revisited before paid acquisition. |
| Pricing/FAQ/testimonials | Needs Work | Support page includes packages; marketing-grade pricing/FAQ/testimonial sections need a dedicated landing-page pass. |

## Legal, Privacy, And Operations

| Area | Status | Notes |
| --- | --- | --- |
| Legal pages | Completed | Privacy, Terms, Children's Privacy, Parent Consent, Teacher Terms, Refund/Cancellation pages exist in-app. |
| Legal review | Blocked | Counsel review is required before public child-directed launch. |
| Parent consent | Completed | Parent/child profile creation requires an explicit consent checkbox and stores consent metadata on the user profile. |
| Data deletion | Needs Work | Parents can submit a signed-in data deletion support case. Backend deletion/export fulfillment still needs implementation. |
| Support operations | Needs Work | Support page, email path, and Firestore `supportCases` intake exist. Ticket routing, SLA, and status page need external setup. |

## Quality And Deployment

| Area | Status | Notes |
| --- | --- | --- |
| CI quality gates | Completed | GitHub Actions runs install, typecheck, unit tests, audit, coverage, e2e, and build. |
| Tests | Needs Work | Current suite covers core flows. More tests are needed for Cloud Functions, invite acceptance, child profiles, and legal routes. |
| Backend dependency audit | Completed | App audit passes at moderate level. Functions deploy and typecheck pass in GitHub Actions. Recheck regularly as Firebase dependencies update. |
| Performance | Needs Work | Bundle is acceptable for beta. Lazy route loading and Lighthouse budgets remain. |
| PWA/offline | Needs Work | Manifest exists; service worker/offline sync is not implemented. |
| Rollback | Completed | See `docs/deployment.md`. |

## Manual Go-Live Checklist

1. Deploy Firestore rules and verify denied reads for unassigned teacher/student cross-access.
2. Deploy Firebase Functions with Stripe secrets and price IDs.
3. Configure Stripe webhook endpoint for `stripeWebhook`.
4. Use Stripe test clocks/test cards to verify active, past-due, canceled, refunded, and disputed states.
5. Confirm Family Plus and Teacher Pro docs appear in `subscriptions/{uid}` after backend-created checkout.
6. Confirm premium routes fail closed when `subscriptions/{uid}` is missing.
7. Add legal-approved Privacy, Terms, COPPA/parent-consent, Teacher Terms, and Refund text.
8. Disable demo/Auth0 fallback for public production if Firebase is not configured.
9. Confirm parent consent storage and data deletion support-case intake.
10. Run `npm run check`, `npm run test`, `npm run test:coverage`, `npm run test:e2e`, `npm run build`, and `npm audit --audit-level=moderate`.
11. Review mobile layouts on at least iPhone SE width, modern iPhone width, Android width, and tablet width.
12. Confirm support email, Stripe portal, cancellation instructions, and refund policy are visible.
13. Confirm skipped student signup creates `studentPlacementQueue/{uid}` and a Teacher Pro account can claim the student only while under capacity.
