import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ActivityIndicator, Pressable, Modal } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Flashcard } from "@/components/flashcard";
import { VocabularyItem, vocabulary } from "@/data/vocabulary";
import {
  loadProgress,
  loadCurrentIndex,
  saveCurrentIndex,
  markRemembered,
  markForgot,
  markVeryFamiliar,
  getLearningQueue,
  getLearningStats,
  loadStreak,
  updateStreakForGoalCompletion,
  debugForgottenWords,
  StreakData,
  ProgressData,
} from "@/stores/vocabulary-store";

const DAILY_GOAL = 50;

interface CongratulationModalProps {
  isVisible: boolean;
  rememberedToday: number;
  streak: StreakData | null;
  onContinue: () => void;
  onStop: () => void;
}

function CongratulationModal({ isVisible, rememberedToday, streak, onContinue, onStop }: CongratulationModalProps) {
  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onStop}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} className="flex items-center justify-center p-4">
        {/* Fireworks background effect (non-interactive behind the dialog) */}
        <View className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1, opacity: 0.65 }}>
          {[...Array(12)].map((_, i) => (
            <View
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: 6 + Math.random() * 8,
                height: 6 + Math.random() * 8,
                backgroundColor: "rgba(250, 204, 21, 0.9)",
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <View
              key={`spark-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: 4 + Math.random() * 6,
                height: 4 + Math.random() * 6,
                backgroundColor: "rgba(244, 63, 94, 0.85)",
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${0.5 + Math.random() * 1}s`,
              }}
            />
          ))}
        </View>

        {/* Dialog card */}
        <View
          className="rounded-3xl mx-4 max-w-2xl w-full"
          style={{
            backgroundColor: "#ffffff",
            zIndex: 10,
            padding: 34,
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.14,
            shadowRadius: 28,
            elevation: 14,
            borderWidth: 1,
            borderColor: "#E6F0FF",
          }}
        >
          {/* Close button */}
          <Pressable
            onPress={onStop}
            style={{ position: "absolute", right: 12, top: 12, zIndex: 12, padding: 6 }}
          >
            <Text style={{ fontSize: 18, color: "#374151", fontWeight: "600" }}>✕</Text>
          </Pressable>

          <View className="items-center mb-6" style={{ paddingTop: 8 }}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>🎉</Text>
            <Text style={{ fontSize: 32, fontWeight: "700", color: "#0B63B8", textAlign: "center", marginBottom: 6 }}>
              Congratulations!
            </Text>
            <Text style={{ fontSize: 18, color: "#6B7280", textAlign: "center", marginBottom: 18 }}>
              You reached your daily goal of {DAILY_GOAL} words!
            </Text>
            <View
              style={{
                backgroundColor: "#ECFDF3",
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 24,
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#065F46", fontWeight: "700" }}>🔥 {streak?.currentStreak || 0} day streak!</Text>
            </View>
          </View>

          <View style={{ marginTop: 6 }}>
            <Pressable
              onPress={onContinue}
              style={{
                width: "100%",
                backgroundColor: "#0055A4",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                shadowColor: "#0055A4",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.18,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Continue Bonus Round</Text>
            </Pressable>
          </View>
        </View>

        {/* Invisible background pressable to dismiss modal when tapping outside the card */}
        <Pressable
          onPress={onStop}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          className="bg-transparent"
        />
      </View>
    </Modal>
  );
}

export default function LearnScreen() {
  const [loading, setLoading] = useState(true);
  const [availableCards, setAvailableCards] = useState<VocabularyItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [progress, setProgress] = useState<ProgressData>({});
  const [stats, setStats] = useState<ReturnType<typeof getLearningStats> | null>(null);
  const [sessionRemembered, setSessionRemembered] = useState(0);
  const [bonusRemembered, setBonusRemembered] = useState(0);
  const [isBonusMode, setIsBonusMode] = useState(false);
  const [showCongratulation, setShowCongratulation] = useState(false);
  const [sessionStarted, setSessionStarted] = useState<Date | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [key, setKey] = useState(0); // Force re-render of flashcard

  // Use ref to track if initial load is done
  const initialLoadDone = useRef(false);

  // Function to update available cards based on progress
  const updateAvailableCards = (currentProgress: ProgressData) => {
    // Get up to 20 cards for today's learning session
    const learningQueue = getLearningQueue(currentProgress, 20);
    setAvailableCards(learningQueue);
    setStats(getLearningStats(currentProgress));
  };

  useEffect(() => {
    console.log("Starting app initialization...");

    // Try to load saved data first
    async function loadSavedData() {
      try {
        console.log("Loading saved progress data...");
        const [savedProgress, savedStreak] = await Promise.all([
          loadProgress(),
          loadStreak(),
        ]);
        console.log("Saved data loaded:", { progressKeys: Object.keys(savedProgress).length });

        setProgress(savedProgress);
        setStreak(savedStreak);
        updateAvailableCards(savedProgress);
        setSessionStarted(new Date());
        setSessionRemembered(0);
        setLoading(false);

        // Debug forgotten words scheduling
        const debugInfo = debugForgottenWords(savedProgress);
        console.log("Forgotten words debug:", debugInfo);
        console.log("App loading complete - should show flashcards now");
      } catch (error) {
        console.warn("Could not load saved data:", error);
        // Initialize with empty progress
        setProgress({});
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null
        });
        updateAvailableCards({});
        setLoading(false);
      }
    }

    loadSavedData();
  }, []);

  const currentItem = availableCards[currentCardIndex];

  const handleRemember = useCallback(async () => {
    if (!currentItem) return;
    const newProgress = await markRemembered(currentItem.id, progress);
    setProgress(newProgress);
    updateAvailableCards(newProgress);

    if (isBonusMode) {
      // In bonus mode, just increment bonus counter
      setBonusRemembered(prev => prev + 1);
    } else {
      // Normal mode, increment session counter and check for goal completion
      const newRememberedCount = sessionRemembered + 1;
      setSessionRemembered(newRememberedCount);

      // Check if daily goal is reached
      if (newRememberedCount === DAILY_GOAL) {
        console.log("🎉 Daily goal reached!");
        setShowCongratulation(true);
        try {
          const updatedStreak = await updateStreakForGoalCompletion();
          setStreak(updatedStreak);
        } catch (error) {
          console.warn("Error updating streak:", error);
        }
      }
    }

    // Move to next card or loop back to beginning
    const nextIndex = (currentCardIndex + 1) % availableCards.length;
    setCurrentCardIndex(nextIndex);
    await saveCurrentIndex(nextIndex);
    setKey((k) => k + 1); // Force flashcard re-render
  }, [currentItem, progress, currentCardIndex, availableCards.length, updateAvailableCards, sessionRemembered, isBonusMode]);

  const handleContinueBonus = useCallback(() => {
    setShowCongratulation(false);
    setIsBonusMode(true);
    setBonusRemembered(0);
  }, []);

  const handleStopForToday = useCallback(() => {
    setShowCongratulation(false);
    // Could navigate to a summary screen or just close the modal
    // For now, just hide the modal
  }, []);

  const handleForgot = useCallback(async () => {
    if (!currentItem) return;
    const newProgress = await markForgot(currentItem.id, progress);
    setProgress(newProgress);
    updateAvailableCards(newProgress);

    // Debug: Show when this word will be reviewed next
    const nextReview = newProgress[currentItem.id]?.nextReviewDate;
    if (nextReview) {
      const hoursUntilReview = Math.round((nextReview - Date.now()) / (60 * 60 * 1000));
      console.log(`"${currentItem.french}" scheduled for review in ${hoursUntilReview} hours`);
    }

    // Move to next card or loop back to beginning
    const nextIndex = (currentCardIndex + 1) % availableCards.length;
    setCurrentCardIndex(nextIndex);
    await saveCurrentIndex(nextIndex);
    setKey((k) => k + 1); // Force flashcard re-render
  }, [currentItem, progress, currentCardIndex, availableCards.length, updateAvailableCards]);

  const handleVeryFamiliar = useCallback(async () => {
    if (!currentItem) return;
    // Mark as very familiar
    const newProgress = await markVeryFamiliar(currentItem.id, progress);
    setProgress(newProgress);
    updateAvailableCards(newProgress);

    // Move to next card or loop back to beginning
    const nextIndex = (currentCardIndex + 1) % availableCards.length;
    setCurrentCardIndex(nextIndex);
    await saveCurrentIndex(nextIndex);
    setKey((k) => k + 1); // Force flashcard re-render
  }, [currentItem, progress, currentCardIndex, availableCards.length, updateAvailableCards]);

  // Keyboard shortcuts for web: ArrowRight = Remember, ArrowLeft = Forgot (future)
  useEffect(() => {
    // Only run on web / browser environments
    if (typeof window === "undefined") return;

    function onKeyDown(e: KeyboardEvent) {
      // Ignore when focus is on input/textarea or contentEditable
      const active = document.activeElement as HTMLElement | null;
      const isTyping =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable);

      if (isTyping) return;

      if (e.key === "ArrowRight") {
        // Swipe right -> remember
        e.preventDefault();
        // Call the remember handler if available
        // Use setTimeout to avoid blocking the event loop inside React event handling
        setTimeout(() => {
          handleRemember();
        }, 0);
      }

      // ArrowLeft -> forgot (swipe left)
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setTimeout(() => {
          handleForgot();
        }, 0);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRemember, handleForgot]);

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
  const recentlyForgotten = progress[currentItem.id] ?
    (Date.now() - progress[currentItem.id].lastReviewed) < (24 * 60 * 60 * 1000) && forgotCount > 0
    : false;

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-primary">Frenchie</Text>
        <View className="items-end">
          <Text className="text-sm text-muted text-right">
            Today's goal: {sessionRemembered}/{DAILY_GOAL}
          </Text>
          <View className="flex-row items-center mt-1">
            {isBonusMode ? (
              <>
                <Text className="text-xs text-purple-600 font-semibold">
                  Bonus: {bonusRemembered}
                </Text>
                <Text className="ml-2 text-xs text-purple-500">🎯</Text>
              </>
            ) : (
              <>
                {sessionRemembered >= DAILY_GOAL && (
                  <Text className="ml-1 text-xs">🎉</Text>
                )}
                {streak && streak.currentStreak > 0 && (
                  <Text className="ml-2 text-xs text-orange-500">
                    🔥 {streak.currentStreak}
                  </Text>
                )}
                <View className="ml-2 w-12 h-1 bg-muted rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${sessionRemembered >= DAILY_GOAL ? 'bg-green-500' : 'bg-primary'}`}
                    style={{
                      width: `${Math.min((sessionRemembered / DAILY_GOAL) * 100, 100)}%`
                    }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Flashcard */}
      {!showCongratulation && (
        <View className="flex-1">
          <Flashcard
            key={key}
            item={currentItem}
            onRemember={handleRemember}
            onForgot={handleForgot}
            onVeryFamiliar={handleVeryFamiliar}
            forgotCount={forgotCount}
            recentlyForgotten={recentlyForgotten}
          />
        </View>
      )}

      {/* Congratulation Modal */}
      <CongratulationModal
        isVisible={showCongratulation}
        rememberedToday={sessionRemembered}
        streak={streak}
        onContinue={handleContinueBonus}
        onStop={handleStopForToday}
      />
    </ScreenContainer>
  );
}
