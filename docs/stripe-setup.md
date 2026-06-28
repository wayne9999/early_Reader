# Stripe Setup

ReadNest uses separate Firebase projects and separate Stripe modes for
development and production.

## Environment Boundary

| Environment | Hosting | Firebase project | Stripe mode | Callable functions | Firestore entitlement |
| --- | --- | --- | --- | --- | --- |
| Development | `https://wayne9999.github.io/early_Reader/` | `readnest-dev-f9c67` | Test | `createCheckoutSessionTest`, `createBillingPortalSessionTest` | `testSubscriptions/{uid}` |
| Production | `https://myreadnest.org/` | `readnest-f9c67` | Live | `createCheckoutSession`, `createBillingPortalSession` | `subscriptions/{uid}` |

The development build is rejected if it contains a live donation link. The production build is rejected if it contains a test donation link. Test webhooks cannot write production entitlement documents, and test subscriptions never set production custom claims.

## Development Stripe Configuration

Repository variables:

- `VITE_STRIPE_DONATION_LINK`
- `VITE_STRIPE_FAMILY_PLUS_LINK`
- `VITE_STRIPE_TEACHER_PRO_LINK`
- `VITE_STRIPE_CUSTOMER_PORTAL_LINK`
- `STRIPE_FAMILY_PLUS_PRICE_ID`
- `STRIPE_TEACHER_PRO_PRICE_ID`

Repository/Firebase secrets:

- `STRIPE_SECRET_KEY` beginning with `sk_test_`
- `STRIPE_WEBHOOK_SECRET` beginning with `whsec_`

Test webhook:

```text
https://us-central1-readnest-dev-f9c67.cloudfunctions.net/stripeWebhookTest
```

## Production Stripe Configuration

Configure these in the protected GitHub `production` environment:

Variables:

- `PROD_VITE_STRIPE_DONATION_LINK`
- `PROD_VITE_STRIPE_FAMILY_PLUS_LINK`
- `PROD_VITE_STRIPE_TEACHER_PRO_LINK`
- `PROD_VITE_STRIPE_CUSTOMER_PORTAL_LINK`
- `PROD_STRIPE_FAMILY_PLUS_PRICE_ID`
- `PROD_STRIPE_TEACHER_PRO_PRICE_ID`

Secrets:

- `STRIPE_LIVE_SECRET_KEY` beginning with `sk_live_`
- `STRIPE_LIVE_WEBHOOK_SECRET` beginning with `whsec_`

Live webhook:

```text
https://us-central1-readnest-f9c67.cloudfunctions.net/stripeWebhook
```

Required events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `charge.refunded`
- `charge.dispute.created`

Run **Deploy Live Stripe Billing** from GitHub Actions after configuring the live values. The protected `production` environment requires human approval before secrets are synchronized or functions are deployed.

## Checkout Metadata

Backend-created Checkout Sessions attach:

- `firebaseUid`
- `tier`
- `role`
- `stripeMode`

Static Payment Links are used only for public donations. Family Plus and Teacher Pro always start through authenticated Firebase callables.

## Customer Portal

Development and production create fresh portal sessions with the matching Stripe customer:

- test customer IDs stay in `testSubscriptions`
- live customer IDs stay in `subscriptions`
- test portal sessions return to GitHub Pages
- live portal sessions return to `myreadnest.org`

Never store a short-lived `billing.stripe.com/p/session/...` URL in GitHub variables.

## Production Activation Checklist

1. Activate the Stripe account and complete business verification in [Stripe account onboarding](https://dashboard.stripe.com/account/onboarding).
2. Switch Stripe Dashboard to live mode.
3. Copy the live restricted or secret API key from [Stripe API keys](https://dashboard.stripe.com/apikeys). It must begin with `sk_live_`; store it as `STRIPE_LIVE_SECRET_KEY` in the GitHub `production` environment.
4. Create live Family Plus and Teacher Pro recurring prices in [Stripe products](https://dashboard.stripe.com/products), then store their `price_...` IDs as `PROD_STRIPE_FAMILY_PLUS_PRICE_ID` and `PROD_STRIPE_TEACHER_PRO_PRICE_ID`.
5. Create live hosted checkout/payment links in [Stripe payment links](https://dashboard.stripe.com/payment-links), then store them as `PROD_VITE_STRIPE_DONATION_LINK`, `PROD_VITE_STRIPE_FAMILY_PLUS_LINK`, and `PROD_VITE_STRIPE_TEACHER_PRO_LINK`.
6. Configure the live Customer Portal in [Stripe customer portal settings](https://dashboard.stripe.com/settings/billing/portal), then store the production portal link as `PROD_VITE_STRIPE_CUSTOMER_PORTAL_LINK`.
7. Create the live webhook endpoint in [Stripe webhooks](https://dashboard.stripe.com/webhooks) and copy its signing secret to `STRIPE_LIVE_WEBHOOK_SECRET`.
8. Add production variables and secrets to the GitHub `production` environment.
9. Run **Deploy Live Stripe Billing** and approve the environment gate.
10. Promote the frontend release into `production`.
11. Complete a low-value live transaction and refund it.
12. Confirm `subscriptions/{uid}` updates and `testSubscriptions/{uid}` remains unchanged.

Card data remains entirely on Stripe-hosted pages.
