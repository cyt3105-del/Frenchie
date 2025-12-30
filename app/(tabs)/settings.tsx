import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Slider from "@react-native-community/slider";
import { ScreenContainer } from "@/components/screen-container";
import {
  VoiceOption,
  getAvailableFrenchVoices,
  getAvailableFrenchVoicesWeb,
  loadSelectedVoice,
  saveSelectedVoice,
  loadSpeechRate,
  saveSpeechRate,
} from "../../stores/voice-store";

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (Platform.OS === "web") {
        // For web, wait for voices to load and use web-specific function
        const loadWebVoices = () => {
          const webVoices = getAvailableFrenchVoicesWeb();
          setVoices(webVoices);
          setLoading(false);
        };
        
        // Trigger voice loading
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          // Get voices immediately (might be empty initially)
          window.speechSynthesis.getVoices();
          
          // Listen for voiceschanged event
          const handleVoicesChanged = () => {
            loadWebVoices();
            window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
          };
          
          window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
          
          // Try loading immediately
          loadWebVoices();
          
          // Also try after a delay as fallback
          setTimeout(loadWebVoices, 500);
        } else {
          setLoading(false);
        }
      } else {
        const availableVoices = await getAvailableFrenchVoices();
        setVoices(availableVoices);
        setLoading(false);
      }
      
      const [savedVoice, savedRate] = await Promise.all([
        loadSelectedVoice(),
        loadSpeechRate(),
      ]);
      setSelectedVoice(savedVoice);
      setSpeechRate(savedRate);
    }
    init();
  }, []);

  const handleSelectVoice = useCallback(
    async (voiceId: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedVoice(voiceId);
      await saveSelectedVoice(voiceId);
    },
    []
  );

  const handleTestVoice = useCallback(
    async (voice: VoiceOption) => {
      if (testingVoice) {
        await Speech.stop();
        setTestingVoice(null);
        return;
      }

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setTestingVoice(voice.identifier);

      await Speech.speak("Bonjour, comment allez-vous ?", {
        voice: voice.identifier,
        language: voice.language,
        rate: speechRate,
        pitch: 1.0,
        onDone: () => setTestingVoice(null),
        onError: () => setTestingVoice(null),
        onStopped: () => setTestingVoice(null),
      });
    },
    [speechRate, testingVoice]
  );

  const handleRateChange = useCallback(async (value: number) => {
    const roundedValue = Math.round(value * 100) / 100;
    setSpeechRate(roundedValue);
    await saveSpeechRate(roundedValue);
  }, []);

  const renderVoiceItem = useCallback(
    ({ item }: { item: VoiceOption }) => {
      const isSelected = selectedVoice === item.identifier;
      const isTesting = testingVoice === item.identifier;

      return (
        <Pressable
          onPress={() => handleSelectVoice(item.identifier)}
          style={({ pressed }) => [
            styles.voiceItem,
            isSelected && styles.voiceItemSelected,
            pressed && styles.voiceItemPressed,
          ]}
        >
          <View className="flex-1">
            <Text
              className={`text-base font-medium ${
                isSelected ? "text-primary" : "text-foreground"
              }`}
            >
              {item.name}
            </Text>
            <Text className="text-xs text-muted mt-0.5">
              {item.language} • {item.quality}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Test button */}
            <Pressable
              onPress={() => handleTestVoice(item)}
              style={({ pressed }) => [
                styles.testButton,
                pressed && styles.testButtonPressed,
                isTesting && styles.testButtonActive,
              ]}
            >
              <MaterialIcons
                name={isTesting ? "stop" : "volume-up"}
                size={20}
                color={isTesting ? "#0055A4" : "#6B7280"}
              />
            </Pressable>

            {/* Selection indicator */}
            {isSelected && (
              <MaterialIcons name="check-circle" size={24} color="#0055A4" />
            )}
          </View>
        </Pressable>
      );
    },
    [selectedVoice, testingVoice, handleSelectVoice, handleTestVoice]
  );

  const keyExtractor = useCallback((item: VoiceOption) => item.identifier, []);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0055A4" />
        <Text className="text-muted mt-4">Loading voices...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-primary">Settings</Text>
        <Text className="text-sm text-muted mt-1">
          Customize your learning experience
        </Text>
      </View>

      {/* Speech Rate Section */}
      <View className="px-4 mb-6">
        <Text className="text-base font-semibold text-foreground mb-2">
          Speech Speed
        </Text>
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Slower</Text>
            <Text className="text-sm font-medium text-primary">
              {speechRate.toFixed(2)}x
            </Text>
            <Text className="text-sm text-muted">Faster</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={1.5}
            step={0.05}
            value={speechRate}
            onSlidingComplete={handleRateChange}
            minimumTrackTintColor="#0055A4"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#0055A4"
          />
        </View>
      </View>

      {/* Voice Selection Section */}
      <View className="flex-1 px-4">
        <Text className="text-base font-semibold text-foreground mb-2">
          French Voice
        </Text>
        {voices.length === 0 ? (
          <View className="bg-surface rounded-2xl p-6 border border-border items-center">
            <MaterialIcons name="mic-off" size={48} color="#9CA3AF" />
            <Text className="text-base text-foreground text-center mt-4 mb-2">
              No French voices found
            </Text>
            <Text className="text-sm text-muted text-center leading-5">
              Your device doesn't have French voices installed.{"\n"}
              Check your device's language settings to download French voices.
            </Text>
          </View>
        ) : (
          <FlatList
            data={voices}
            renderItem={renderVoiceItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text className="text-xs text-muted mb-3">
                {voices.length} French voice{voices.length !== 1 ? "s" : ""}{" "}
                available on your device
              </Text>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  slider: {
    width: "100%",
    height: 40,
  },
  listContent: {
    paddingBottom: 100,
  },
  separator: {
    height: 8,
  },
  voiceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  voiceItemSelected: {
    borderColor: "#0055A4",
    backgroundColor: "rgba(0, 85, 164, 0.05)",
  },
  voiceItemPressed: {
    opacity: 0.7,
  },
  testButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  testButtonPressed: {
    opacity: 0.7,
  },
  testButtonActive: {
    backgroundColor: "rgba(0, 85, 164, 0.15)",
  },
});
