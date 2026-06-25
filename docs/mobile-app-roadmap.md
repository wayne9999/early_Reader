# ReadNest Mobile App Roadmap

## Recommendation

Use Capacitor with the existing React and TypeScript application for the first Android and iOS releases.

This keeps one activity UI and one learning-event model across web, Android, and iOS while allowing native integrations where they matter. A React Native rewrite would provide more native UI control, but it would duplicate the current application before the product and learning flows are stable.

## Shared Architecture

- React/TypeScript feature code remains shared.
- Firebase Auth, Firestore, Functions, Storage, and analytics remain the backend.
- Firebase App Check uses reCAPTCHA v3 on web, App Attest or DeviceCheck on iOS, and Play Integrity on Android.
- Capacitor plugins provide native speech, audio, secure storage, deep links, network state, push notifications, and accessibility hooks.
- Crashlytics and Performance Monitoring provide mobile observability.
- Firestore remains the learning-history authority, with an offline queue that uses idempotent event IDs.

## Billing

Keep Stripe Billing for web subscriptions.

For digital features sold inside App Store or Google Play builds, add native store billing. RevenueCat is the recommended entitlement layer because it can normalize Apple and Google subscription events and sync them into the same trusted backend entitlement model used by Stripe.

The backend should map all providers into `subscriptions/{uid}`:

- `provider: stripe | apple | google`
- provider customer and transaction identifiers
- tier and status
- renewal or expiration date
- cancellation state
- latest verified event

Do not open Stripe Checkout from the native app for digital premium access unless the applicable store rules and regional programs explicitly allow it.

## Phases

### Phase 1: Installable Web App

- finish `myreadnest.org`
- add service worker and offline shell
- add install prompts
- verify tablet layouts and touch targets
- validate session resume and safe event synchronization

### Phase 2: Capacitor Shell

- add Capacitor configuration
- create Android and iOS projects
- configure bundle IDs
- add native Firebase applications
- add deep links for `myreadnest.org`
- replace browser-only speech and auth edges with native adapters
- distribute through Firebase App Distribution and TestFlight

### Phase 3: Store Billing And Release

- create Apple and Google subscription products
- integrate RevenueCat
- sync verified entitlements to Firestore through the backend
- add restore-purchases and manage-subscription screens
- complete child-safety, privacy nutrition label, data safety, and store review material
- run Firebase Test Lab and physical-device accessibility testing

## Suggested Identifiers

- iOS bundle ID: `org.myreadnest.app`
- Android application ID: `org.myreadnest.app`
- Universal/App Link domain: `myreadnest.org`

Reserve these identifiers before building store artifacts.
