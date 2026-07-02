# mobile-init

Bootstrap the ReadNest Expo React Native project with full Firebase integration, ready for Android and iOS.

## What this skill does

1. Creates an Expo project (TypeScript, Expo Router) in a sibling `readnest-mobile/` directory
2. Installs all required dependencies (React Native Firebase, Stripe, Expo modules)
3. Writes `app.json` / `eas.json` with correct bundle IDs and Firebase project references
4. Scaffolds `src/` directory structure mirroring the web app (screens, hooks, services, types)
5. Copies shared business logic that is platform-agnostic (types, constants, Firestore service calls)
6. Writes a `firebaseConfig.ts` that reads from environment variables via `expo-constants`
7. Creates a base `app/_layout.tsx` with Firebase Auth provider and Expo Router stack
8. Writes placeholder screens for every route in the web app

## Steps

### 1 — Scaffold Expo project

```bash
cd ..
npx create-expo-app@latest readnest-mobile --template expo-template-blank-typescript
cd readnest-mobile
```

### 2 — Install dependencies

```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar expo-splash-screen
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/app-check
npx expo install @stripe/stripe-react-native
npx expo install expo-speech
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-safe-area-context react-native-screens
npx expo install expo-build-properties
```

### 3 — Configure app.json

Write `app.json` with:
- `name`: "ReadNest"
- `slug`: "readnest"
- `scheme`: "readnest" (deep linking)
- `android.package`: "com.readnest.app"
- `ios.bundleIdentifier`: "com.readnest.app"
- `android.googleServicesFile`: "./google-services.json"
- `ios.googleServicesFile`: "./GoogleService-Info.plist"
- `plugins`: `["expo-router", "@react-native-firebase/app", "expo-build-properties"]`
- `expo-build-properties`: `{ android: { compileSdkVersion: 35 }, ios: { deploymentTarget: "15.0" } }`

### 4 — Write eas.json

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 5 — Scaffold directory structure

```
readnest-mobile/
  app/
    _layout.tsx          ← Root layout with Firebase Auth + Expo Router
    index.tsx            ← Home / activity picker
    reading.tsx          ← Reading practice screen
    memory.tsx           ← Memory game screen
    progress.tsx         ← Progress dashboard
    teacher.tsx          ← Teacher dashboard (Teacher Pro gate)
    account.tsx          ← Sign-in / subscription management
    rhymes.tsx
    soundSort.tsx
    sentenceBuilder.tsx
    storyOrder.tsx
    wordMeaning.tsx
  src/
    firebase/
      config.ts          ← Firebase app initialization
      auth.ts            ← Auth helpers (signIn, signOut, onAuthStateChanged)
      firestore.ts       ← Firestore CRUD helpers (progress, events, profiles)
    hooks/
      useAuth.ts
      useProgress.ts
      useSubscription.ts
    components/
      ActivityCard.tsx
      ProgressBar.tsx
      WordCard.tsx
      MemoryTile.tsx
    constants/
      sightWords.ts      ← Copy from web app src/
      memoryContent.ts
    types/
      index.ts           ← Copy UserProfile, Progress, LearningEvent from web app
```

### 6 — Write src/firebase/config.ts

```typescript
import { getApps, initializeApp } from '@react-native-firebase/app';
import Constants from 'expo-constants';

const firebaseConfig = Constants.expoConfig?.extra?.firebaseConfig;

if (!getApps().length) {
  initializeApp(firebaseConfig);
}
```

### 7 — Write app/_layout.tsx

```typescript
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/hooks/useAuth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
```

### 8 — Copy shared types and content

Copy from the web app's `src/` directory:
- `src/types/` → `readnest-mobile/src/types/`
- Any `*Content.ts` or `*Words.ts` constant files (pure data, no browser APIs)

Do NOT copy:
- CSS files
- Browser-specific hooks (useLocalStorage, SpeechSynthesis)
- React DOM components

### 9 — Instruct on Google Services files

Tell the user:
> You need `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) from Firebase Console → Project Settings → Your Apps. Place them in the `readnest-mobile/` root. These are gitignored — do not commit them.

### 10 — Verify setup

```bash
cd readnest-mobile
npx expo start
```

Confirm the dev client launches without errors.

---

## Notes

- Use `@react-native-firebase` (native modules) not the web Firebase SDK — it gives better performance and offline support on mobile.
- `expo-speech` replaces the web `SpeechSynthesis` API for read-aloud.
- `@react-native-async-storage/async-storage` replaces `localStorage` for guest progress.
- Stripe checkout on mobile should use Stripe's `initPaymentSheet` + `presentPaymentSheet` flow, not redirect to a web URL.
