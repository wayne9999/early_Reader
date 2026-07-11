const naturalVoiceHints = [
  "Natural",
  "Jenny",
  "Aria",
  "Samantha",
  "Zira",
  "Google US English",
  "Microsoft"
];

let cachedVoice: SpeechSynthesisVoice | null = null;

function chooseFriendlyVoice() {
  if (cachedVoice) {
    return cachedVoice;
  }

  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const usEnglishVoices = englishVoices.filter((voice) => voice.lang.toLowerCase().startsWith("en-us"));

  cachedVoice =
    naturalVoiceHints
      .map((hint) =>
        usEnglishVoices.find((voice) => voice.name.toLowerCase().includes(hint.toLowerCase()))
      )
      .find(Boolean) ??
    usEnglishVoices[0] ??
    englishVoices[0] ??
    voices[0] ??
    null;

  return cachedVoice;
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    cachedVoice = null;
    chooseFriendlyVoice();
  });
}

function makeUtterance(text: string, options: Partial<SpeechSynthesisUtterance> = {}) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = chooseFriendlyVoice();

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "en-US";
  }

  utterance.rate = options.rate ?? 0.86;
  utterance.pitch = options.pitch ?? 1.18;
  utterance.volume = options.volume ?? 1;
  return utterance;
}

export function speak(text: string, options: Partial<SpeechSynthesisUtterance> = {}) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(makeUtterance(text, options));
}

// Prefers native OS TTS inside the Capacitor shell; falls back to browser
// SpeechSynthesis on the web. All existing web callers get the upgrade for
// free because `speakWord`, `speakSentence`, etc. delegate here.
async function speakBestAvailable(text: string, options: Partial<SpeechSynthesisUtterance> = {}) {
  try {
    const { speakAdaptive } = await import("./nativeSpeech");
    await speakAdaptive(text, {
      rate: options.rate,
      pitch: options.pitch,
      volume: options.volume
    });
  } catch {
    speak(text, options);
  }
}

export function speakWord(word: string) {
  void speakBestAvailable(word, { rate: 0.82, pitch: 1.22 });
}

export function speakSentence(sentence: string) {
  void speakBestAvailable(sentence, { rate: 0.84, pitch: 1.14 });
}

export function speakSounds(sounds: string[], word: string) {
  void speakBestAvailable(`${sounds.join(" ... ")}. Blend it together: ${word}!`, {
    rate: 0.72,
    pitch: 1.2
  });
}

export function celebrate(message = "Great job! You did it!") {
  void speakBestAvailable(message, { rate: 0.94, pitch: 1.28 });
}
