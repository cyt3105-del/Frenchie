import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

const SELECTED_VOICE_KEY = "frenchie_selected_voice";
const SPEECH_RATE_KEY = "frenchie_speech_rate";

export interface VoiceOption {
  identifier: string;
  name: string;
  language: string;
  quality: string;
}

// Preferred voice names to keep
const PREFERRED_VOICES = [
  "Amelie",
  "Amélie",
  "Daniel",
];

// Get all available French voices on the device, filtered to preferred voices
export async function getAvailableFrenchVoices(): Promise<VoiceOption[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    
    // Filter for French voices and preferred names
    const frenchVoices = voices
      .filter((voice) => {
        const languageMatch = voice.language.startsWith("fr");
        const name = (voice.name || voice.identifier).toLowerCase();
        const isPreferred = PREFERRED_VOICES.some(
          (preferred) => name.includes(preferred.toLowerCase())
        );
        return languageMatch && isPreferred;
      })
      .map((voice) => ({
        identifier: voice.identifier,
        name: voice.name || voice.identifier,
        language: voice.language,
        quality: voice.quality || "Default",
      }));
    
    // Return only the preferred voices (Amelie and Daniel)
    
    // Sort: Daniel first, then Amelie
    frenchVoices.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      if (aName.includes("daniel")) return -1;
      if (bName.includes("daniel")) return 1;
      if (aName.includes("amelie") || aName.includes("amélie")) return -1;
      if (bName.includes("amelie") || bName.includes("amélie")) return 1;
      return 0;
    });
    
    return frenchVoices;
  } catch (error) {
    console.error("Error getting voices:", error);
    return [];
  }
}

// Load saved voice preference
export async function loadSelectedVoice(): Promise<string | null> {
  try {
    const voiceId = await AsyncStorage.getItem(SELECTED_VOICE_KEY);
    return voiceId;
  } catch (error) {
    console.error("Error loading selected voice:", error);
    return null;
  }
}

// Save voice preference
export async function saveSelectedVoice(voiceId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SELECTED_VOICE_KEY, voiceId);
  } catch (error) {
    console.error("Error saving selected voice:", error);
  }
}

// Load speech rate preference
export async function loadSpeechRate(): Promise<number> {
  try {
    const rate = await AsyncStorage.getItem(SPEECH_RATE_KEY);
    return rate ? parseFloat(rate) : 0.85;
  } catch (error) {
    console.error("Error loading speech rate:", error);
    return 0.85;
  }
}

// Save speech rate preference
export async function saveSpeechRate(rate: number): Promise<void> {
  try {
    await AsyncStorage.setItem(SPEECH_RATE_KEY, rate.toString());
  } catch (error) {
    console.error("Error saving speech rate:", error);
  }
}

// Get available French voices for web (using Web Speech API)
export function getAvailableFrenchVoicesWeb(): VoiceOption[] {
  if (Platform.OS !== "web" || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  const preferredNames = ["amelie", "amélie", "daniel"];

  const frenchVoices = voices
    .filter((voice) => {
      const languageMatch = voice.lang.startsWith("fr");
      const name = voice.name.toLowerCase();
      const isPreferred = preferredNames.some(
        (preferred) => name.includes(preferred)
      );
      return languageMatch && isPreferred;
    })
    .map((voice) => ({
      identifier: voice.voiceURI || voice.name,
      name: voice.name,
      language: voice.lang,
      quality: voice.localService ? "Enhanced" : "Default",
    }));

  // Sort: Daniel first, then Amelie
  frenchVoices.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    if (aName.includes("daniel")) return -1;
    if (bName.includes("daniel")) return 1;
    if (aName.includes("amelie") || aName.includes("amélie")) return -1;
    if (bName.includes("amelie") || bName.includes("amélie")) return 1;
    return 0;
  });

  return frenchVoices;
}

// Clear voice settings
export async function clearVoiceSettings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SELECTED_VOICE_KEY);
    await AsyncStorage.removeItem(SPEECH_RATE_KEY);
  } catch (error) {
    console.error("Error clearing voice settings:", error);
  }
}
