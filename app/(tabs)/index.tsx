import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Flashcard } from "@/components/flashcard";
import { VocabularyItem } from "@/data/vocabulary";
import {
  loadProgress,
  loadCurrentIndex,
  saveCurrentIndex,
  markRemembered,
  markForgot,
  markVeryFamiliar,
  getShuffledVocabulary,
  ProgressData,
} from "@/stores/vocabulary-store";

export default function LearnScreen() {
  const [loading, setLoading] = useState(true);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<ProgressData>({});
  const [key, setKey] = useState(0); // Force re-render of flashcard

  // Use ref to track if initial load is done
  const initialLoadDone = useRef(false);

  useEffect(() => {
    console.log("Starting app initialization...");

    // Immediate loading - don't wait for AsyncStorage
    console.log("Loading vocabulary data...");
    const shuffled = getShuffledVocabulary();
    console.log("Vocabulary loaded:", shuffled.length, "items");

    setVocabulary(shuffled);
    setProgress({});
    setCurrentIndex(0);
    setLoading(false);
    console.log("App loading complete - should show flashcards now");

    // Try to load saved data in background (don't block UI)
    async function loadSavedData() {
      try {
        console.log("Loading saved progress data...");
        const [savedProgress, savedIndex] = await Promise.all([
          loadProgress(),
          loadCurrentIndex(),
        ]);
        console.log("Saved data loaded:", { progressKeys: Object.keys(savedProgress).length, currentIndex: savedIndex });
        setProgress(savedProgress);
        setCurrentIndex(savedIndex % shuffled.length);
      } catch (error) {
        console.warn("Could not load saved data:", error);
        // Keep default values
      }
    }

    loadSavedData();
  }, []);

  const currentItem = vocabulary[currentIndex];

  const handleRemember = useCallback(async () => {
    if (!currentItem) return;
    const newProgress = await markRemembered(currentItem.id, progress);
    setProgress(newProgress);

    // Move to next card
    const nextIndex = (currentIndex + 1) % vocabulary.length;
    setCurrentIndex(nextIndex);
    await saveCurrentIndex(nextIndex);
    setKey((k) => k + 1); // Force flashcard re-render
  }, [currentItem, progress, currentIndex, vocabulary.length]);

  const handleForgot = useCallback(async () => {
    if (!currentItem) return;
    const newProgress = await markForgot(currentItem.id, progress);
    setProgress(newProgress);

    // Move to next card
    const nextIndex = (currentIndex + 1) % vocabulary.length;
    setCurrentIndex(nextIndex);
    await saveCurrentIndex(nextIndex);
    setKey((k) => k + 1); // Force flashcard re-render
  }, [currentItem, progress, currentIndex, vocabulary.length]);

  const handleVeryFamiliar = useCallback(async () => {
    if (!currentItem) return;
    // Mark as very familiar
    const newProgress = await markVeryFamiliar(currentItem.id, progress);
    setProgress(newProgress);

    // Move to next card
    const nextIndex = (currentIndex + 1) % vocabulary.length;
    setCurrentIndex(nextIndex);
    await saveCurrentIndex(nextIndex);
    setKey((k) => k + 1); // Force flashcard re-render
  }, [currentItem, progress, currentIndex, vocabulary.length]);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0055A4" />
        <Text className="text-muted mt-4">Loading vocabulary...</Text>
        <Text className="text-xs text-muted mt-2">
          Vocabulary array length: {vocabulary.length}
        </Text>
      </ScreenContainer>
    );
  }

  if (!currentItem) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-xl text-foreground text-center">
          No vocabulary available
        </Text>
      </ScreenContainer>
    );
  }

  const forgotCount = progress[currentItem.id]?.forgotCount || 0;

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-primary">Frenchie</Text>
        <Text className="text-sm text-muted">
          {currentIndex + 1} / {vocabulary.length}
        </Text>
      </View>

      {/* Flashcard */}
      <View className="flex-1">
        <Flashcard
          key={key}
          item={currentItem}
          onRemember={handleRemember}
          onForgot={handleForgot}
          onVeryFamiliar={handleVeryFamiliar}
          forgotCount={forgotCount}
        />
      </View>
    </ScreenContainer>
  );
}
