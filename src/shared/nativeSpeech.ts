import { whenNative } from "../platform/nativeBridge";
import { speak as webSpeak } from "./speech";

// Keep this adapter separate from the web speech module so a native TTS plugin
// can be reintroduced when its iOS build is compatible with the current
// Capacitor major version. For now, Web Speech is the stable cross-platform
// path and avoids shipping a native dependency that fails iOS builds.

type SpeakOptions = { rate?: number; pitch?: number; volume?: number };

async function trySpeakNative(text: string, options: SpeakOptions) {
  return whenNative(async () => {
    webSpeak(text, options);
    return true;
  });
}

/**
 * Speak `text` using the best stable engine available in the current shell.
 */
export async function speakAdaptive(text: string, options: SpeakOptions = {}) {
  const spokenNatively = await trySpeakNative(text, options).catch(() => false);
  if (spokenNatively) {
    return;
  }

  webSpeak(text, options);
}
