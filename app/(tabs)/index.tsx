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
    async function init() {
      if (initialLoadDone.current) return;
      initialLoadDone.current = true;

      try {
        const [savedProgress, savedIndex] = await Promise.all([
          loadProgress(),
          loadCurrentIndex(),
        ]);
        const shuffled = getShuffledVocabulary();
        setVocabulary(shuffled);
        setProgress(savedProgress);
        setCurrentIndex(savedIndex % shuffled.length);
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback: load without saved data
        const shuffled = getShuffledVocabulary();
        setVocabulary(shuffled);
        setProgress({});
        setCurrentIndex(0);
      } finally {
        setLoading(false);
      }
    }

    // Add a timeout in case AsyncStorage hangs
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("Loading timeout - using fallback");
        const shuffled = getShuffledVocabulary();
        setVocabulary(shuffled);
        setProgress({});
        setCurrentIndex(0);
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    init();

    return () => clearTimeout(timeout);
  }, [loading]);

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

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0055A4" />
        <Text className="text-muted mt-4">Loading vocabulary...</Text>
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
          forgotCount={forgotCount}
        />
      </View>
    </ScreenContainer>
  );
}
