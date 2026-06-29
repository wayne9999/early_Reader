import { httpsCallable } from "firebase/functions";
import { getFirebaseRuntime } from "./firebase";
import { speakSentence } from "../shared/speech";

type ActivityVoiceClipRequest = {
  activityId: string;
  roundKey: string;
  text: string;
};

type ActivityVoiceClipResponse = {
  audioBase64?: string;
  audioMimeType?: string;
  provider?: "elevenLabs" | "browser";
};

const clipCache = new Map<string, string>();
let activeAudio: HTMLAudioElement | null = null;

function cacheKeyFor(request: ActivityVoiceClipRequest) {
  return `${request.activityId}:${request.roundKey}:${request.text}`;
}

async function playAudioDataUrl(dataUrl: string) {
  activeAudio?.pause();
  activeAudio = new Audio(dataUrl);
  await activeAudio.play();
}

export async function playActivityVoicePrompt(request: ActivityVoiceClipRequest) {
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;
  const cacheKey = cacheKeyFor(request);
  const cachedClip = clipCache.get(cacheKey);

  if (cachedClip) {
    await playAudioDataUrl(cachedClip);
    return "elevenLabs";
  }

  if (!runtime || !firebaseUser) {
    speakSentence(request.text);
    return "browser";
  }

  try {
    const createActivityVoiceClip = httpsCallable<ActivityVoiceClipRequest, ActivityVoiceClipResponse>(
      runtime.functions,
      "createActivityVoiceClip"
    );
    const response = await createActivityVoiceClip(request);

    if (response.data.audioBase64) {
      const dataUrl = `data:${response.data.audioMimeType ?? "audio/mpeg"};base64,${response.data.audioBase64}`;
      clipCache.set(cacheKey, dataUrl);
      await playAudioDataUrl(dataUrl);
      return response.data.provider ?? "elevenLabs";
    }
  } catch {
    // Browser speech keeps paid games usable if the provider is not configured yet.
  }

  speakSentence(request.text);
  return "browser";
}
