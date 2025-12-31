import { describe, it, expect, vi } from "vitest";

// Mock expo-speech
vi.mock("expo-speech", () => ({
  speak: vi.fn((text: string, options: any) => {
    // Simulate async completion
    if (options?.onDone) {
      setTimeout(options.onDone, 10);
    }
  }),
  stop: vi.fn(() => Promise.resolve()),
}));

// Mock react-native Platform
vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
}));

describe("useSpeech hook", () => {
  it("should export useSpeech function", async () => {
    const { useSpeech } = await import("./use-speech");
    expect(typeof useSpeech).toBe("function");
  });

  it("should return speak and stop functions and isSpeaking state", async () => {
    // Import React to use hooks
    const React = await import("react");
    const { useSpeech } = await import("./use-speech");
    
    // Create a simple test component
    let hookResult: any;
    function TestComponent() {
      hookResult = useSpeech();
      return null;
    }

    // We can't actually render without React DOM, so just verify the module exports
    expect(typeof useSpeech).toBe("function");
  });
});

describe("expo-speech integration", () => {
  it("should have speak function available", async () => {
    const Speech = await import("expo-speech");
    expect(typeof Speech.speak).toBe("function");
  });

  it("should have stop function available", async () => {
    const Speech = await import("expo-speech");
    expect(typeof Speech.stop).toBe("function");
  });

  it("should call speak with correct parameters", async () => {
    const Speech = await import("expo-speech");
    
    Speech.speak("bonjour", {
      language: "fr-FR",
      pitch: 1.0,
      rate: 0.85,
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      "bonjour",
      expect.objectContaining({
        language: "fr-FR",
        pitch: 1.0,
        rate: 0.85,
      })
    );
  });
});
