# Mobile Phase 2: Capacitor Shell Setup

Everything the Capacitor shell needs is checked in. The native `ios/` and
`android/` directories are **not** committed — they are generated locally
from the Capacitor config and re-synced on every build. This keeps the
codebase small and stops platform-specific tooling from drifting.

## What ships in this repo

- `capacitor.config.ts` — bundle IDs, WebView server config, deep-link
  scheme, plugin settings.
- `src/platform/nativeBridge.ts` — runtime capability detector. `whenNative()`
  is the single entry point every native-only code path goes through so web
  builds tree-shake native imports.
- `src/platform/nativeDeepLinks.ts` — wires Capacitor `appUrlOpen` events
  into ReadNest's hash router so Universal Links / App Links land in the
  right route.
- `src/shared/nativeSpeech.ts` — native TTS via
  `@capacitor-community/text-to-speech`, with graceful fallback to browser
  `SpeechSynthesis`. All existing `speakSentence` / `speakWord` /
  `speakSounds` / `celebrate` callers pick this up automatically.
- `public/.well-known/apple-app-site-association` and
  `public/.well-known/assetlinks.json` — Universal Link and Android App
  Link verification files. Firebase Hosting is already configured to serve
  them with the correct `Content-Type`.
- `.github/workflows/build-mobile.yml` — CI pipeline to build Android
  release AABs and iOS IPAs and upload to Firebase App Distribution or
  TestFlight.
- `npm run cap:*` scripts — one-liners for common Capacitor tasks.

## One-time developer setup

You need a Mac to build iOS. Android builds fine on Linux/Windows/Mac.

```bash
# 1. Install dependencies (already covered by npm ci if you cloned fresh)
npm ci

# 2. Add the native projects locally. Do this once per machine; the resulting
#    ios/ and android/ directories are .gitignored on purpose.
npm run cap:add:android
npm run cap:add:ios     # Mac only

# 3. Build the web bundle and sync it into the native shells.
npm run cap:sync
```

After `cap add ios`, open `ios/App/App.xcworkspace` in Xcode and:

- Set the **Team** on the App target.
- Verify the bundle identifier matches `org.myreadnest.app`.
- Add **Associated Domains** capability with `applinks:myreadnest.org` so
  Universal Links resolve.
- Add the **Push Notifications** capability if/when the roadmap adds
  Crashlytics / FCM push.

After `cap add android`, open `android/` in Android Studio and:

- Verify `applicationId "org.myreadnest.app"` in `android/app/build.gradle`.
- Add the intent-filter for `myreadnest.org` in `AndroidManifest.xml`
  (Android Studio's App Link Assistant does this in one click).
- Generate the Play App Signing SHA-256 fingerprint from Play Console and
  replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256_FINGERPRINT` in
  `public/.well-known/assetlinks.json`, then re-deploy Hosting.

Do the same for the iOS `TEAMIDPLACEHOLDER` in
`public/.well-known/apple-app-site-association` — replace with your Apple
Developer Team ID and re-deploy Hosting. Apple caches the AASA file, so give
it up to 24 hours after any change.

## Development loop (live reload on device)

```bash
# Start Vite as usual
CAPACITOR_ENV=development CAPACITOR_DEV_URL="http://192.168.1.42:4173" \
  npm run dev

# In another shell, sync + open the native project
npm run cap:sync
npm run cap:open:ios   # or cap:open:android
```

Replace `192.168.1.42` with your workstation LAN IP. The device must be on
the same network. Vite's WebSocket hot reload works over the LAN just like
in the browser.

## Firebase App Setup (native side)

Both native shells register as their own Firebase Apps against the same
project (`readnest-f9c67` in production):

1. **Firebase Console → Project settings → Your apps → Add app → iOS.**
   - Bundle ID: `org.myreadnest.app`
   - Download `GoogleService-Info.plist`.
   - Drop it at `ios/App/App/GoogleService-Info.plist` and add it to the
     Xcode target's file list.
2. **Firebase Console → Add app → Android.**
   - Package name: `org.myreadnest.app`
   - Add the Play App Signing SHA-1 and SHA-256 fingerprints (needed for
     App Links + phone auth).
   - Download `google-services.json`.
   - Drop it at `android/app/google-services.json`.
3. **Firebase App Check** — enable App Attest for iOS and Play Integrity
   for Android in Console. The web already runs reCAPTCHA v3. All three
   flow through the same enforced-in-production callables.

Store both files as GitHub repo secrets (`GOOGLE_SERVICE_INFO_PLIST` and
`GOOGLE_SERVICES_JSON`) so the CI workflow can inject them at build time.

## Billing on native (RevenueCat)

Per the roadmap: **do not** open Stripe Checkout from the native shell for
digital premium access. Apple and Google require in-app purchases for
digital subscriptions.

- Create Family Plus and Teacher Pro subscription products in App Store
  Connect and Play Console at the same price points ($7/mo and $19/mo).
- Add RevenueCat as the entitlement layer.
- The backend already models `subscriptions/{uid}` with `source: stripe`
  for web. Extend it with `source: apple | google` and a
  `revenueCatCustomerId`. The web `subscription_active` event still fires
  regardless of source.

The Capacitor shell can still let signed-in users **manage** an existing
Stripe subscription from the Account page — the "Manage or cancel" button
opens the Stripe Customer Portal in the system browser, which the store
rules allow.

## Distribution

Trigger `.github/workflows/build-mobile.yml` with the platform and channel
you want:

- **Android → Internal**: builds an AAB and uploads to Firebase App
  Distribution for the `internal-testers` group. Requires
  `FIREBASE_ANDROID_APP_ID` var + `READNEST_FIREBASE_SERVICE_ACCOUNT`
  secret + release-signing secrets (`ANDROID_KEYSTORE_BASE64`,
  `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).
- **iOS → TestFlight**: builds an IPA and uploads via `xcrun altool`.
  Requires `APPSTORE_CONNECT_API_KEY`, `APPSTORE_CONNECT_KEY_ID`,
  `APPSTORE_CONNECT_ISSUER_ID` secrets plus signing (`IOS_DIST_CERT_P12_BASE64`,
  `IOS_DIST_CERT_PASSWORD`, `IOS_APP_STORE_PROVISION_BASE64`,
  `IOS_EXPORT_OPTIONS_PLIST`).

The workflow tolerates missing secrets — steps that need them are guarded
by `if: ${{ secrets.NAME != '' }}` so you can start with unsigned builds
and add secrets one at a time.

## What is deliberately not automated

- **First `cap add ios` / `cap add android`.** These need to run on a
  machine with the SDK, and they generate machine-specific Xcode / Gradle
  files. Committing them creates merge conflicts every time anyone does a
  local build. Instead, `ios/` and `android/` are in `.gitignore` and
  regenerated per-workstation from the Capacitor config.
- **Push notifications, Crashlytics, and RevenueCat SDK wiring.** These
  live in the Phase 3 slice of the mobile roadmap.
