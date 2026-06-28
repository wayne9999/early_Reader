import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpsCallable } from "firebase/functions";
import { speakSentence } from "../shared/speech";
import { getFirebaseRuntime } from "./firebase";
import { playActivityVoicePrompt } from "./activityVoiceService";

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn()
}));

vi.mock("./firebase", () => ({
  getFirebaseRuntime: vi.fn()
}));

vi.mock("../shared/speech", () => ({
  speakSentence: vi.fn()
}));

describe("activityVoiceService", () => {
  beforeEach(() => {
    vi.mocked(httpsCallable).mockReset();
    vi.mocked(speakSentence).mockReset();
    vi.mocked(getFirebaseRuntime).mockReturnValue({
      auth: { currentUser: { uid: "student-1" } },
      functions: {}
    } as never);

    vi.stubGlobal("Audio", vi.fn(function MockAudio(this: { pause: () => void; play: () => Promise<void> }) {
      this.pause = vi.fn();
      this.play = vi.fn().mockResolvedValue(undefined);
    }));
  });

  it("plays backend-generated premium voice audio", async () => {
    vi.mocked(httpsCallable).mockReturnValue(vi.fn().mockResolvedValue({
      data: {
        provider: "elevenLabs",
        audioMimeType: "audio/mpeg",
        audioBase64: "ZmFrZQ=="
      }
    }) as never);

    await expect(playActivityVoicePrompt({
      activityId: "voiceQuest",
      roundKey: "1-sun",
      text: "I shine in the sky."
    })).resolves.toBe("elevenLabs");

    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), "createActivityVoiceClip");
    expect(window.Audio).toHaveBeenCalledWith("data:audio/mpeg;base64,ZmFrZQ==");
    expect(speakSentence).not.toHaveBeenCalled();
  });

  it("falls back to browser speech when Firebase is unavailable", async () => {
    vi.mocked(getFirebaseRuntime).mockReturnValue(null);

    await expect(playActivityVoicePrompt({
      activityId: "voiceQuest",
      roundKey: "2-book",
      text: "I have pages."
    })).resolves.toBe("browser");

    expect(httpsCallable).not.toHaveBeenCalled();
    expect(speakSentence).toHaveBeenCalledWith("I have pages.");
  });
});
