# mobile-screen

Convert a ReadNest web screen into a production-quality React Native screen for the Expo mobile app.

## Usage

```
/mobile-screen <screen-name>
```

Examples:
- `/mobile-screen reading` — converts the Reading Practice screen
- `/mobile-screen memory` — converts the Memory Game screen
- `/mobile-screen progress` — converts the Progress Dashboard
- `/mobile-screen teacher` — converts the Teacher Dashboard

## What this skill does

1. Reads the corresponding web component from the ReadNest `src/` directory
2. Converts React DOM elements → React Native equivalents
3. Converts CSS classes/stylesheets → `StyleSheet.create()` with mobile-optimized values
4. Replaces browser APIs with React Native / Expo equivalents
5. Integrates with Expo Router navigation
6. Adds platform-specific polish (safe areas, keyboard avoiding, haptics)
7. Writes the completed screen to `readnest-mobile/app/<screen-name>.tsx`

## Conversion reference

| Web | React Native |
|-----|-------------|
| `<div>` | `<View>` |
| `<p>`, `<span>`, `<h1-6>` | `<Text>` |
| `<button>` | `<Pressable>` or `<TouchableOpacity>` |
| `<input>` | `<TextInput>` |
| `<img>` | `<Image>` |
| `<ul>/<li>` | `<FlatList>` or `<ScrollView>` with mapped `<View>` items |
| CSS flexbox | StyleSheet flexbox (same properties, no units) |
| `px` units | Raw numbers (device-independent pixels) |
| `rem` / `em` | Fixed numbers or `PixelRatio.getFontScale()` |
| CSS hover | `Pressable` `onPressIn`/`onPressOut` state |
| `window.speechSynthesis` | `expo-speech` `Speech.speak()` |
| `localStorage` | `@react-native-async-storage/async-storage` |
| `useNavigate()` | `useRouter()` from `expo-router` |
| `window.open()` | `Linking.openURL()` |
| CSS animations | `Animated` API or `react-native-reanimated` |

## Screen-specific instructions

### reading.tsx
- Use `FlatList` for the word list with `numColumns` for grid layout
- `expo-speech` for text-to-speech: `Speech.speak(word, { language: 'en-US', rate: 0.8 })`
- Add haptic feedback on correct answer: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`
- Install: `npx expo install expo-haptics`
- Level selector: horizontal `ScrollView` with pill buttons

### memory.tsx
- Use `FlatList` with `numColumns={4}` for the card grid
- Animated flip effect: `Animated.timing` rotating on Y axis
- Card match celebration: `Haptics.notificationAsync` + brief color flash
- Responsive grid: calculate tile size from `Dimensions.get('window').width`

### progress.tsx
- Use `ScrollView` as root container
- Progress ring: use `react-native-svg` with `<Circle>` stroke-dasharray technique
- Install: `npx expo install react-native-svg`
- Daily goal bar: animated `Animated.Value` width

### teacher.tsx
- Gate with subscription check: show upgrade prompt if not Teacher Pro
- Student list: `FlatList` with pull-to-refresh (`onRefresh`, `refreshing` props)
- Student detail: navigate to a modal screen `app/teacher/[studentId].tsx`

### account.tsx
- Sign-in: Firebase Auth Google sign-in via `@react-native-firebase/auth` + `expo-auth-session` for Google OAuth
- Stripe: use `@stripe/stripe-react-native` `initPaymentSheet` instead of redirect
- Show subscription tier badge with upgrade/manage buttons

## Template structure

```typescript
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';

export default function <ScreenName>Screen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* screen content */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
});
```

## After conversion

1. Run `npx expo start` and test on both Android emulator and iOS simulator
2. Test with a real device via Expo Go or development build
3. Check that Firebase reads/writes work (Firestore rules apply to mobile too)
4. Verify text-to-speech audio plays correctly
5. Test subscription gates redirect correctly to account screen
