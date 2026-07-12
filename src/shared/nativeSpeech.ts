import { whenNative } from "../platform/nativeBridge";
import { speak as webSpeak } from "./speech";

// Wraps the browser SpeechSynthesis adapter so calls transparently go to the
// OS TTS engine on native iOS/Android via @capacitor-community/text-to-speech.
// Speech is a critical part of ReadNest for early readers, so failing to a
// working voice matters more than getting the "best" voice.

type SpeakOptions = { rate?: number; pitch?: number; volume?: number };

async function trySpeakNative(text: string, options: SpeakOptions) {
  return whenNative(async () => {
    const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
    try {
      await TextToSpeech.stop();
    } catch {
      // stop() throws on iOS if nothing is playing; not fatal.
    }

    await TextToSpeech.speak({
      text,
      lang: "en-US",
      // The plugin uses different rate scales per platform; normalize.
      rate: options.rate ?? 0.86,
      pitch: options.pitch ?? 1.18,
      volume: options.volume ?? 1,
      category: "playback"
    });
    return true;
  });
}

/**
 * Speak `text` using the best available engine. Native TTS wins when in the
 * Capacitor shell; otherwise falls back to the browser SpeechSynthesis code
 * already used across ReadNest.
 */
export async function speakAdaptive(text: string, options: SpeakOptions = {}) {
  const spokenNatively = await trySpeakNative(text, options).catch(() => false);
  if (spokenNatively) {
    return;
  }

  webSpeak(text, options);
}
