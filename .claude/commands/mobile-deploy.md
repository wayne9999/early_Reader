# mobile-deploy

Build and deploy the ReadNest mobile app to Google Play Store and Apple App Store using EAS Build.

## Usage

```
/mobile-deploy <target>
```

Targets:
- `/mobile-deploy preview` — Internal APK/IPA for testing
- `/mobile-deploy production` — Store-ready build + submission
- `/mobile-deploy ota` — Over-the-air JS update (no store review needed)

## Prerequisites checklist

Before running any build, confirm these are in place:

- [ ] `google-services.json` in project root (from Firebase Console)
- [ ] `GoogleService-Info.plist` in project root (from Firebase Console)
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged in to Expo: `eas login`
- [ ] For iOS: Apple Developer account connected: `eas credentials`
- [ ] For Android: Google Play Console account + service account JSON for automated submission
- [ ] Stripe publishable key in `app.json` under `extra.stripePublishableKey`
- [ ] Firebase config values in `app.json` under `extra.firebaseConfig`

## app.json extra section

```json
{
  "expo": {
    "extra": {
      "firebaseConfig": {
        "apiKey": "YOUR_API_KEY",
        "authDomain": "YOUR_PROJECT.firebaseapp.com",
        "projectId": "YOUR_PROJECT_ID",
        "storageBucket": "YOUR_PROJECT.appspot.com",
        "messagingSenderId": "YOUR_SENDER_ID",
        "appId": "YOUR_APP_ID"
      },
      "stripePublishableKey": "pk_live_..."
    }
  }
}
```

> Keep secrets out of `app.json` — use EAS Secrets for private keys:
> `eas secret:create --scope project --name STRIPE_SECRET_KEY --value sk_live_...`

## Preview build (internal testing)

```bash
cd readnest-mobile

# Android APK — share directly with testers
eas build --platform android --profile preview

# iOS IPA — distribute via TestFlight or direct install
eas build --platform ios --profile preview
```

Share the download link with testers. No store account needed for Android APK.

## Production build

```bash
# Build both platforms
eas build --platform all --profile production

# Submit to stores after build completes
eas submit --platform android --latest
eas submit --platform ios --latest
```

EAS Submit handles:
- Android: uploads AAB to Google Play (internal track by default)
- iOS: uploads IPA to App Store Connect, triggers TestFlight processing

## Over-the-air update (JS-only changes)

For bug fixes and content changes that don't touch native code:

```bash
eas update --branch production --message "Fix word list typo"
```

Users get the update silently on next app launch. No store review.
Only works for JavaScript/TypeScript changes — native module changes require a full build.

## Firebase App Check for mobile

Add App Check to the mobile app to prevent abuse:

```typescript
// src/firebase/appCheck.ts
import { firebase } from '@react-native-firebase/app';
import appCheck from '@react-native-firebase/app-check';

export async function initAppCheck() {
  const provider = firebase.appCheck().newReactNativeFirebaseAppCheckProvider();
  await provider.configure({
    android: {
      provider: 'playIntegrity',
      // fallback to safetyNet for older devices
    },
    ios: {
      provider: 'deviceCheck',
    },
    isTokenAutoRefreshEnabled: true,
  });
  await firebase.appCheck().initializeAppCheck({ provider, isTokenAutoRefreshEnabled: true });
}
```

Call `initAppCheck()` in `app/_layout.tsx` before any Firestore reads.

Register the Android and iOS apps in Firebase Console → App Check and enable enforcement after testing.

## Environment channels

| Channel | Firebase Project | Stripe Mode | Build Profile |
|---------|-----------------|-------------|---------------|
| `development` | readnest-dev | test | `development` |
| `preview` | readnest-dev | test | `preview` |
| `production` | readnest-prod | live | `production` |

Switch environments by setting `EXPO_PUBLIC_ENV` in EAS build profiles or using separate `app.config.ts` with environment-based config selection.

## Store listing assets needed

**Both stores:**
- App icon: 1024×1024 PNG (no alpha, no rounded corners — stores apply their own mask)
- Feature graphic (Android): 1024×500 PNG
- Screenshots: at least 2 per device type

**Google Play:**
- Short description (80 chars max)
- Full description (4000 chars max)
- Content rating questionnaire (select "Everyone" — educational app for kids)
- COPPA / CCPA declaration (app targets under-13, requires parental consent flow)

**Apple App Store:**
- Privacy policy URL (already live at `#/privacy`)
- Age rating: 4+ (Educational)
- In-app purchases must be registered in App Store Connect before submission

## COPPA compliance note

ReadNest targets K-2 students. Both stores require:
- Google Play: declare "Designed for families" in Play Console → app content
- Apple: age rating 4+, restrict ad tracking

The existing parent consent flow in the web app satisfies COPPA for data collection — carry this consent screen into the mobile onboarding.
