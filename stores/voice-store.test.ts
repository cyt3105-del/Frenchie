import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// Mock expo-speech
vi.mock("expo-speech", () => ({
  getAvailableVoicesAsync: vi.fn(() =>
    Promise.resolve([
      {
        identifier: "com.apple.voice.compact.fr-FR.Thomas",
        name: "Thomas",
        language: "fr-FR",
        quality: "Default",
      },
      {
        identifier: "com.apple.voice.compact.fr-FR.Amelie",
        name: "Amelie",
        language: "fr-FR",
        quality: "Enhanced",
      },
      {
        identifier: "com.apple.voice.compact.en-US.Samantha",
        name: "Samantha",
        language: "en-US",
        quality: "Default",
      },
    ])
  ),
}));

describe("voice-store", () => {
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  describe("getAvailableFrenchVoices", () => {
    it("should filter and return only French voices", async () => {
      const { getAvailableFrenchVoices } = await import("./voice-store");
      const voices = await getAvailableFrenchVoices();

      expect(voices).toHaveLength(2);
      expect(voices[0].language).toBe("fr-FR");
      expect(voices[1].language).toBe("fr-FR");
    });

    it("should not include non-French voices", async () => {
      const { getAvailableFrenchVoices } = await import("./voice-store");
      const voices = await getAvailableFrenchVoices();

      const englishVoice = voices.find((v) => v.language === "en-US");
      expect(englishVoice).toBeUndefined();
    });
  });

  describe("loadSelectedVoice", () => {
    it("should return null when no voice is saved", async () => {
      const { loadSelectedVoice } = await import("./voice-store");
      const voice = await loadSelectedVoice();
      expect(voice).toBeNull();
    });

    it("should return saved voice identifier", async () => {
      mockStorage["frenchie_selected_voice"] = "test-voice-id";
      const { loadSelectedVoice } = await import("./voice-store");
      const voice = await loadSelectedVoice();
      expect(voice).toBe("test-voice-id");
    });
  });

  describe("saveSelectedVoice", () => {
    it("should save voice identifier to storage", async () => {
      const { saveSelectedVoice, loadSelectedVoice } = await import(
        "./voice-store"
      );
      await saveSelectedVoice("new-voice-id");

      expect(mockStorage["frenchie_selected_voice"]).toBe("new-voice-id");
    });
  });

  describe("loadSpeechRate", () => {
    it("should return default rate when none is saved", async () => {
      const { loadSpeechRate } = await import("./voice-store");
      const rate = await loadSpeechRate();
      expect(rate).toBe(0.85);
    });

    it("should return saved rate", async () => {
      mockStorage["frenchie_speech_rate"] = "1.2";
      const { loadSpeechRate } = await import("./voice-store");
      const rate = await loadSpeechRate();
      expect(rate).toBe(1.2);
    });
  });

  describe("saveSpeechRate", () => {
    it("should save speech rate to storage", async () => {
      const { saveSpeechRate } = await import("./voice-store");
      await saveSpeechRate(1.0);

      expect(mockStorage["frenchie_speech_rate"]).toBe("1");
    });
  });

  describe("clearVoiceSettings", () => {
    it("should clear all voice settings", async () => {
      mockStorage["frenchie_selected_voice"] = "test-voice";
      mockStorage["frenchie_speech_rate"] = "1.0";

      const { clearVoiceSettings } = await import("./voice-store");
      await clearVoiceSettings();

      expect(mockStorage["frenchie_selected_voice"]).toBeUndefined();
      expect(mockStorage["frenchie_speech_rate"]).toBeUndefined();
    });
  });
});
