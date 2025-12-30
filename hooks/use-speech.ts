import { useCallback, useState, useEffect, useRef } from "react";
import * as Speech from "expo-speech";
import { Platform } from "react-native";
import {
  loadSelectedVoice,
  loadSpeechRate,
  VoiceOption,
} from "../stores/voice-store";

// Web Speech API support check
const isWebSpeechSupported = Platform.OS === "web" && typeof window !== "undefined" && "speechSynthesis" in window;

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(0.85);
  const webSpeechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      const [voice, rate] = await Promise.all([
        loadSelectedVoice(),
        loadSpeechRate(),
      ]);
      if (voice) setSelectedVoice(voice);
      setSpeechRate(rate);
    }
    loadPreferences();
  }, []);

  // Web-specific speech implementation using Web Speech API
  const speakWeb = useCallback(
    async (text: string) => {
      if (!isWebSpeechSupported) {
        console.warn("Web Speech API not supported in this browser");
        return;
      }

      // Stop any ongoing speech first
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }

      setIsSpeaking(true);

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "fr-FR";
        utterance.rate = speechRate;
        utterance.pitch = 1.0;

        // Get all voices and filter for preferred French voices
        const voices = window.speechSynthesis.getVoices();
        const preferredNames = ["amelie", "amélie", "daniel", "léa", "lea", "thomas"];
        
        // First, try to find the selected voice if it matches preferred names
        let selectedVoiceObj = null;
        if (selectedVoice) {
          selectedVoiceObj = voices.find(
            (v) => (v.name === selectedVoice || v.voiceURI === selectedVoice) &&
                   v.lang.startsWith("fr")
          );
        }
        
        // If selected voice is preferred, use it
        if (selectedVoiceObj && preferredNames.some(name => 
          selectedVoiceObj.name.toLowerCase().includes(name)
        )) {
          utterance.voice = selectedVoiceObj;
        } else {
          // Otherwise, find preferred French voices in priority order
          const frenchVoices = voices.filter(
            (voice) => voice.lang.startsWith("fr")
          );
          
          // Priority: Amelie > Daniel > Léa > other French female voices
          let preferredVoice = frenchVoices.find((v) => 
            v.name.toLowerCase().includes("amelie") || 
            v.name.toLowerCase().includes("amélie")
          );
          
          if (!preferredVoice) {
            preferredVoice = frenchVoices.find((v) => 
              v.name.toLowerCase().includes("daniel")
            );
          }
          
          if (!preferredVoice) {
            preferredVoice = frenchVoices.find((v) => 
              v.name.toLowerCase().includes("léa") || 
              v.name.toLowerCase().includes("lea")
            );
          }
          
          // If still no preferred voice, try to find any natural French female voice
          if (!preferredVoice) {
            const femaleNames = ["marie", "sophie", "celine", "céline", "isabelle"];
            preferredVoice = frenchVoices.find((v) =>
              femaleNames.some((name) => v.name.toLowerCase().includes(name))
            );
          }
          
          // Fallback to any French voice
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          } else if (frenchVoices.length > 0) {
            utterance.voice = frenchVoices[0];
          }
        }

        utterance.onend = () => {
          setIsSpeaking(false);
          webSpeechUtteranceRef.current = null;
        };

        utterance.onerror = (error) => {
          console.error("Web Speech error:", error);
          setIsSpeaking(false);
          webSpeechUtteranceRef.current = null;
        };

        webSpeechUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Web Speech error:", error);
        setIsSpeaking(false);
      }
    },
    [isSpeaking, selectedVoice, speechRate]
  );

  // Native/mobile speech implementation using expo-speech
  const speakNative = useCallback(
    async (text: string) => {
      // Stop any ongoing speech first
      if (isSpeaking) {
        await Speech.stop();
      }

      setIsSpeaking(true);

      try {
        const options: Speech.SpeechOptions = {
          language: "fr-FR",
          pitch: 1.0,
          rate: speechRate,
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
        };

        // Add voice if selected
        if (selectedVoice) {
          options.voice = selectedVoice;
        }

        await Speech.speak(text, options);
      } catch (error) {
        console.error("Speech error:", error);
        setIsSpeaking(false);
      }
    },
    [isSpeaking, selectedVoice, speechRate]
  );

  const speak = useCallback(
    async (text: string) => {
      if (Platform.OS === "web" && isWebSpeechSupported) {
        await speakWeb(text);
      } else {
        await speakNative(text);
      }
    },
    [speakWeb, speakNative]
  );

  const stop = useCallback(async () => {
    try {
      if (Platform.OS === "web" && isWebSpeechSupported) {
        window.speechSynthesis.cancel();
        webSpeechUtteranceRef.current = null;
      } else {
        await Speech.stop();
      }
      setIsSpeaking(false);
    } catch (error) {
      console.error("Stop speech error:", error);
    }
  }, []);

  // Update voice selection (called from settings)
  const updateVoice = useCallback((voiceId: string | null) => {
    setSelectedVoice(voiceId);
  }, []);

  // Update speech rate (called from settings)
  const updateRate = useCallback((rate: number) => {
    setSpeechRate(rate);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    selectedVoice,
    speechRate,
    updateVoice,
    updateRate,
  };
}
