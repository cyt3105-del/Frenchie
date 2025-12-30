import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { VocabularyItem } from "../data/vocabulary";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/hooks/use-speech";

interface FlashcardProps {
  item: VocabularyItem;
  onRemember: () => void;
  onForgot: () => void;
  onVeryFamiliar?: () => void;
  forgotCount?: number;
}

const levelColors: Record<string, { bg: string; text: string }> = {
  A2: { bg: "bg-blue-500", text: "text-white" },
  B1: { bg: "bg-purple-500", text: "text-white" },
  B2: { bg: "bg-pink-500", text: "text-white" },
};

export function Flashcard({
  item,
  onRemember,
  onForgot,
  onVeryFamiliar,
  forgotCount = 0,
}: FlashcardProps) {
  const [revealed, setRevealed] = useState(false);
  const scale = useSharedValue(1);
  const contentOpacity = useSharedValue(0);
  const { speak, isSpeaking } = useSpeech();

  // Swipe gesture values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const swipeOpacity = useSharedValue(0);
  const rememberOpacity = useSharedValue(0);
  const forgotOpacity = useSharedValue(0);
  const familiarOpacity = useSharedValue(0);

  const handleReveal = useCallback(() => {
    if (!revealed) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setRevealed(true);
      contentOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [revealed, contentOpacity]);

  const handleSpeak = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    speak(item.french);
  }, [speak, item.french]);

  const handleRemember = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    scale.value = withSequence(
      withTiming(0.97, { duration: 80 }),
      withTiming(1, { duration: 80 })
    );
    // Reset state for next card
    setRevealed(false);
    contentOpacity.value = 0;
    translateX.value = 0;
    translateY.value = 0;
    swipeOpacity.value = 0;
    rememberOpacity.value = 0;
    forgotOpacity.value = 0;
    familiarOpacity.value = 0;
    onRemember();
  }, [onRemember, scale, contentOpacity, translateX, translateY, swipeOpacity, rememberOpacity, forgotOpacity, familiarOpacity]);

  const handleVeryFamiliar = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    scale.value = withSequence(
      withTiming(0.97, { duration: 80 }),
      withTiming(1, { duration: 80 })
    );
    // Reset state for next card
    setRevealed(false);
    contentOpacity.value = 0;
    translateX.value = 0;
    translateY.value = 0;
    swipeOpacity.value = 0;
    rememberOpacity.value = 0;
    forgotOpacity.value = 0;
    familiarOpacity.value = 0;
    onVeryFamiliar?.();
  }, [onVeryFamiliar, scale, contentOpacity, translateX, translateY, swipeOpacity, rememberOpacity, forgotOpacity, familiarOpacity]);

  const handleForgot = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withTiming(0.97, { duration: 80 }),
      withTiming(1, { duration: 80 })
    );
    // Reset state for next card
    setRevealed(false);
    contentOpacity.value = 0;
    translateX.value = 0;
    translateY.value = 0;
    swipeOpacity.value = 0;
    rememberOpacity.value = 0;
    forgotOpacity.value = 0;
    familiarOpacity.value = 0;
    onForgot();
  }, [onForgot, scale, contentOpacity, translateX, translateY, swipeOpacity, rememberOpacity, forgotOpacity, familiarOpacity]);


  // Gesture handler for swipe actions
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Store initial position
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Determine primary swipe direction
      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);

      if (absY > absX && absY > 50) {
        // Vertical swipe (down for very familiar)
        if (translateY.value > 0) {
          familiarOpacity.value = interpolate(
            translateY.value,
            [0, 100],
            [0, 1],
            Extrapolate.CLAMP
          );
          rememberOpacity.value = 0;
          forgotOpacity.value = 0;
        }
      } else if (absX > absY && absX > 50) {
        // Horizontal swipe
        if (translateX.value > 0) {
          // Swiping right (remember)
          rememberOpacity.value = interpolate(
            translateX.value,
            [0, 100],
            [0, 1],
            Extrapolate.CLAMP
          );
          forgotOpacity.value = 0;
          familiarOpacity.value = 0;
        } else {
          // Swiping left (forgot)
          forgotOpacity.value = interpolate(
            Math.abs(translateX.value),
            [0, 100],
            [0, 1],
            Extrapolate.CLAMP
          );
          rememberOpacity.value = 0;
          familiarOpacity.value = 0;
        }
      }

      swipeOpacity.value = interpolate(
        Math.max(absX, absY),
        [0, 50],
        [0, 1],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      const threshold = 120; // Minimum swipe distance to trigger action
      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);

      if (absY > absX && absY > threshold && event.translationY > 0) {
        // Swiped down - very familiar
        runOnJS(handleVeryFamiliar)();
      } else if (absX > absY && absX > threshold) {
        if (event.translationX > 0) {
          // Swiped right - remember
          runOnJS(handleRemember)();
        } else {
          // Swiped left - forgot
          runOnJS(handleForgot)();
        }
      } else {
        // Not enough swipe distance, reset position
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        swipeOpacity.value = withTiming(0, { duration: 200 });
        rememberOpacity.value = withTiming(0, { duration: 200 });
        forgotOpacity.value = withTiming(0, { duration: 200 });
        familiarOpacity.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-200, 0, 200],
          [-15, 0, 15],
          Extrapolate.CLAMP
        )}deg`
      }
    ],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const swipeFeedbackStyle = useAnimatedStyle(() => ({
    opacity: swipeOpacity.value,
  }));

  const rememberFeedbackStyle = useAnimatedStyle(() => ({
    opacity: rememberOpacity.value,
  }));

  const forgotFeedbackStyle = useAnimatedStyle(() => ({
    opacity: forgotOpacity.value,
  }));

  const familiarFeedbackStyle = useAnimatedStyle(() => ({
    opacity: familiarOpacity.value,
  }));

  const levelStyle = levelColors[item.level] || levelColors.A2;
  
  // Gender color for nouns: blue for masculine, red for feminine
  const genderColor = item.gender === "masculine" 
    ? "#3B82F6" // blue-500
    : item.gender === "feminine"
    ? "#EF4444" // red-500
    : null;
  
  // Text style for French word with gender color - always set explicitly
  const frenchWordStyle = genderColor 
    ? { color: genderColor } 
    : {};

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
          <Pressable
            onPress={handleReveal}
            style={({ pressed }) => [
              styles.card,
              pressed && !revealed && styles.cardPressed,
            ]}
          >
        <View className="bg-surface rounded-3xl p-6 flex-1 border border-border shadow-sm">
          {/* Header with level badge and speaker button */}
          <View className="flex-row justify-between items-center mb-6">
            <View className={cn("px-3 py-1 rounded-full", levelStyle.bg)}>
              <Text className={cn("text-xs font-semibold", levelStyle.text)}>
                {item.level}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {forgotCount > 0 && (
                <View className="bg-warning/20 px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-warning">
                    {forgotCount}x forgot
                  </Text>
                </View>
              )}
              {/* Speaker button */}
              <Pressable
                onPress={handleSpeak}
                style={({ pressed }) => [
                  styles.speakerButton,
                  pressed && styles.speakerButtonPressed,
                  isSpeaking && styles.speakerButtonActive,
                ]}
              >
                <MaterialIcons
                  name={isSpeaking ? "volume-up" : "volume-up"}
                  size={22}
                  color={isSpeaking ? "#0055A4" : "#6B7280"}
                />
              </Pressable>
            </View>
          </View>

          {/* Main content area */}
          <View className="flex-1 justify-center items-center">
            {/* French word - always visible, with gender color for nouns */}
            <Text 
              className="text-3xl font-bold text-center mb-2"
              style={[
                { fontSize: 30, fontWeight: "700", textAlign: "center", marginBottom: 8 },
                frenchWordStyle,
              ]}
            >
              {item.french}
            </Text>

            {/* Category tag */}
            <Text className="text-xs text-muted uppercase tracking-wider mb-6">
              {item.category}
            </Text>

            {/* Revealed content */}
            {revealed ? (
              <Animated.View
                style={animatedContentStyle}
                className="items-center w-full"
              >
                {/* English meaning */}
                <Text className="text-xl text-primary font-semibold text-center mb-6">
                  {item.english}
                </Text>

                {/* Example sentence */}
                <View className="bg-background rounded-2xl p-4 w-full">
                  <View className="flex-row items-start gap-2 mb-2">
                    <Pressable
                      onPress={() => speak(item.exampleFr)}
                      style={({ pressed }) => [
                        styles.exampleSpeakerButton,
                        pressed && styles.speakerButtonPressed,
                      ]}
                    >
                      <MaterialIcons
                        name="volume-up"
                        size={16}
                        color="#6B7280"
                      />
                    </Pressable>
                    <Text className="text-base text-foreground italic flex-1 leading-6">
                      "{item.exampleFr}"
                    </Text>
                  </View>
                  <Text className="text-sm text-muted text-center leading-5 ml-6">
                    "{item.exampleEn}"
                  </Text>
                </View>
              </Animated.View>
            ) : (
              <Text className="text-sm text-muted">Tap to reveal</Text>
            )}
          </View>

          {/* Swipe instruction - only visible when revealed */}
          {revealed && (
            <Animated.View
              style={animatedContentStyle}
              className="items-center mt-6"
            >
              <Text className="text-sm text-muted text-center">
                Swipe left to forget, right to remember{"\n"}
                Swipe down for very familiar words
              </Text>
            </Animated.View>
          )}
        </View>
      </Pressable>

      {/* Swipe feedback overlays */}
      <Animated.View style={[styles.swipeFeedback, swipeFeedbackStyle]}>
        <Animated.View style={[styles.rememberFeedback, rememberFeedbackStyle]}>
          <MaterialIcons name="check-circle" size={48} color="#22C55E" />
          <Text style={styles.feedbackText}>Remember</Text>
        </Animated.View>
        <Animated.View style={[styles.forgotFeedback, forgotFeedbackStyle]}>
          <MaterialIcons name="cancel" size={48} color="#F59E0B" />
          <Text style={styles.feedbackText}>Forgot</Text>
        </Animated.View>
        <Animated.View style={[styles.familiarFeedback, familiarFeedbackStyle]}>
          <MaterialIcons name="star" size={48} color="#8B5CF6" />
          <Text style={styles.feedbackText}>Very Familiar</Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
    </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    position: 'relative',
  },
  card: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.95,
  },
  speakerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  speakerButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  speakerButtonActive: {
    backgroundColor: "rgba(0, 85, 164, 0.15)",
  },
  exampleSpeakerButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  forgotButton: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  forgotButtonText: {
    color: "#F59E0B",
    fontWeight: "600",
    fontSize: 16,
  },
  rememberButton: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  rememberButtonText: {
    color: "#22C55E",
    fontWeight: "600",
    fontSize: 16,
  },
  swipeFeedback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  rememberFeedback: {
    position: 'absolute',
    right: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotFeedback: {
    position: 'absolute',
    left: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familiarFeedback: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});
