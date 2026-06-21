# Stripe Setup

ReadNest uses Stripe-hosted payment surfaces so card data never touches the app.

## Frontend Values

Set these as GitHub repository variables for GitHub Pages:

- `VITE_STRIPE_DONATION_LINK`
- `VITE_STRIPE_FAMILY_PLUS_LINK`
- `VITE_STRIPE_TEACHER_PRO_LINK`
- `VITE_STRIPE_CUSTOMER_PORTAL_LINK`

`VITE_STRIPE_CUSTOMER_PORTAL_LINK` must be a durable portal login link or a ReadNest backend endpoint. Do not use a short-lived `billing.stripe.com/p/session/...` URL.

## Backend Secrets

Set these in Firebase Functions:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

Set these environment values for deployed Functions:

- `STRIPE_FAMILY_PLUS_PRICE_ID`
- `STRIPE_TEACHER_PRO_PRICE_ID`
- `READNEST_APP_BASE_URL`

The Functions scaffold currently compiles against the installed Stripe SDK API version. When upgrading Stripe SDKs, update the `apiVersion` in `functions/src/index.ts` and rerun the Functions typecheck.

## Required Checkout Metadata

Stripe Checkout sessions or Payment Links must include:

- `firebaseUid`: Firebase Auth UID for the purchasing user.
- Price IDs matching Family Plus or Teacher Pro.

Without `firebaseUid`, the webhook cannot safely map a purchase to a ReadNest account.

## Webhook Endpoint

Deploy `functions/src/index.ts`, then register the generated `stripeWebhook` HTTPS URL in Stripe Workbench.

Handle these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `charge.refunded`
- `charge.dispute.created`

The webhook writes trusted state to:

```text
subscriptions/{firebaseUid}
```

The frontend reads this document for premium access.

## Billing Portal

Preferred production behavior:

1. User clicks Manage billing.
2. Frontend calls `createBillingPortalSession`.
3. Function verifies Firebase Auth and reads `subscriptions/{uid}.stripeCustomerId`.
4. Function creates a fresh Stripe portal session.
5. User is redirected to Stripe.

For early testing, a durable Stripe portal login link can be used, but a generated 30-minute session URL should not be stored in GitHub variables.

## Local Testing

1. Install function dependencies from `functions/`.
2. Run Stripe CLI webhook forwarding to the local/emulated function.
3. Complete test checkout for Family Plus and Teacher Pro.
4. Confirm Firestore documents update under `subscriptions/{uid}`.
5. Confirm premium routes unlock only after webhook state changes.

## Production Checklist

- Use live Stripe keys only in Firebase Functions secrets.
- Keep Vite frontend variables publishable only.
- Verify webhook signatures.
- Reconcile refunds/disputes before reactivating access.
- Enable Stripe Smart Retries and dunning emails.
- Test cancellation through Customer Portal.
