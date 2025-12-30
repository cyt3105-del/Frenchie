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
  "Léa",
  "Lea",
  "Thomas", // Sometimes Daniel is listed as Thomas on some systems
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
    
    // If we don't have enough voices, try to find a natural French female voice
    const hasAmelie = frenchVoices.some((v) => 
      v.name.toLowerCase().includes("amelie") || v.name.toLowerCase().includes("amélie")
    );
    const hasDaniel = frenchVoices.some((v) => 
      v.name.toLowerCase().includes("daniel")
    );
    const hasFemale = frenchVoices.some((v) => 
      v.name.toLowerCase().includes("lea") || 
      v.name.toLowerCase().includes("léa") ||
      v.name.toLowerCase().includes("amelie") ||
      v.name.toLowerCase().includes("amélie")
    );
    
    // If we're missing a natural French female voice, try to find one
    if (!hasFemale || (!hasAmelie && !hasFemale)) {
      const allFrenchVoices = voices
        .filter((voice) => voice.language.startsWith("fr"))
        .map((voice) => ({
          identifier: voice.identifier,
          name: voice.name || voice.identifier,
          language: voice.language,
          quality: voice.quality || "Default",
        }));
      
      // Look for a French female voice (common names: Amelie, Léa, Marie, Sophie, etc.)
      const femaleVoiceNames = ["amelie", "amélie", "léa", "lea", "marie", "sophie", "celine", "céline"];
      const naturalFemaleVoice = allFrenchVoices.find((voice) =>
        femaleVoiceNames.some((name) => voice.name.toLowerCase().includes(name))
      );
      
      if (naturalFemaleVoice && !frenchVoices.find((v) => v.identifier === naturalFemaleVoice.identifier)) {
        frenchVoices.push(naturalFemaleVoice);
      }
    }
    
    // Ensure we have Daniel/Thomas if available
    if (!hasDaniel) {
      const allFrenchVoices = voices
        .filter((voice) => voice.language.startsWith("fr"))
        .map((voice) => ({
          identifier: voice.identifier,
          name: voice.name || voice.identifier,
          language: voice.language,
          quality: voice.quality || "Default",
        }));
      
      const danielVoice = allFrenchVoices.find((voice) =>
        voice.name.toLowerCase().includes("daniel") || 
        voice.name.toLowerCase().includes("thomas")
      );
      
      if (danielVoice && !frenchVoices.find((v) => v.identifier === danielVoice.identifier)) {
        frenchVoices.push(danielVoice);
      }
    }
    
    // Sort: Amelie first, then Daniel, then others
    frenchVoices.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      if (aName.includes("amelie") || aName.includes("amélie")) return -1;
      if (bName.includes("amelie") || bName.includes("amélie")) return 1;
      if (aName.includes("daniel")) return -1;
      if (bName.includes("daniel")) return 1;
      if (aName.includes("thomas")) return -1;
      if (bName.includes("thomas")) return 1;
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

  // First, try to get all French voices (not just preferred ones)
  const allFrenchVoices = voices
    .filter((voice) => voice.lang.startsWith("fr"))
    .map((voice) => ({
      identifier: voice.voiceURI || voice.name,
      name: voice.name,
      language: voice.lang,
      quality: voice.localService ? "Enhanced" : "Default",
    }));

  // If we have French voices, return them all (don't limit to preferred names)
  if (allFrenchVoices.length > 0) {
    return allFrenchVoices;
  }

  // Fallback: if no French voices found, return empty array
  return [];

  // If we don't have enough voices, try to find a natural French female voice
  const hasAmelie = frenchVoices.some((v) => 
    v.name.toLowerCase().includes("amelie") || v.name.toLowerCase().includes("amélie")
  );
  const hasDaniel = frenchVoices.some((v) => 
    v.name.toLowerCase().includes("daniel")
  );
  const hasFemale = frenchVoices.some((v) => 
    v.name.toLowerCase().includes("lea") || 
    v.name.toLowerCase().includes("léa") ||
    v.name.toLowerCase().includes("amelie") ||
    v.name.toLowerCase().includes("amélie")
  );
  
  // If we're missing a natural French female voice, try to find one
  if (!hasFemale || (!hasAmelie && !hasFemale)) {
    const allFrenchVoices = voices
      .filter((voice) => voice.lang.startsWith("fr"))
      .map((voice) => ({
        identifier: voice.voiceURI || voice.name,
        name: voice.name,
        language: voice.lang,
        quality: voice.localService ? "Enhanced" : "Default",
      }));
    
    // Look for a French female voice
    const femaleVoiceNames = ["amelie", "amélie", "léa", "lea", "marie", "sophie", "celine", "céline"];
    const naturalFemaleVoice = allFrenchVoices.find((voice) =>
      femaleVoiceNames.some((name) => voice.name.toLowerCase().includes(name))
    );
    
    if (naturalFemaleVoice && !frenchVoices.find((v) => v.identifier === naturalFemaleVoice.identifier)) {
      frenchVoices.push(naturalFemaleVoice);
    }
  }
  
  // Ensure we have Daniel/Thomas if available
  if (!hasDaniel) {
    const allFrenchVoices = voices
      .filter((voice) => voice.lang.startsWith("fr"))
      .map((voice) => ({
        identifier: voice.voiceURI || voice.name,
        name: voice.name,
        language: voice.lang,
        quality: voice.localService ? "Enhanced" : "Default",
      }));
    
    const danielVoice = allFrenchVoices.find((voice) =>
      voice.name.toLowerCase().includes("daniel") || 
      voice.name.toLowerCase().includes("thomas")
    );
    
    if (danielVoice && !frenchVoices.find((v) => v.identifier === danielVoice.identifier)) {
      frenchVoices.push(danielVoice);
    }
  }
  
  // Sort: Amelie first, then Daniel, then others
  frenchVoices.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    if (aName.includes("amelie") || aName.includes("amélie")) return -1;
    if (bName.includes("amelie") || bName.includes("amélie")) return 1;
    if (aName.includes("daniel")) return -1;
    if (bName.includes("daniel")) return 1;
    if (aName.includes("thomas")) return -1;
    if (bName.includes("thomas")) return 1;
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
