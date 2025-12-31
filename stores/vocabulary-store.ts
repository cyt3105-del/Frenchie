import AsyncStorage from "@react-native-async-storage/async-storage";
import { vocabulary, VocabularyItem } from "../data/vocabulary";

const PROGRESS_KEY = "frenchie_progress";
const CURRENT_INDEX_KEY = "frenchie_current_index";
const STREAK_KEY = "frenchie_streak";

export interface ProgressData {
  [id: string]: {
    // Legacy fields (keeping for backward compatibility)
    forgotCount: number;
    lastReviewed: number;
    veryFamiliar?: boolean;

    // SM-2 Spaced Repetition fields (optional for backward compatibility)
    interval?: number; // Days until next review
    easeFactor?: number; // Ease factor (starts at 2.5)
    repetition?: number; // Number of successful reviews
    nextReviewDate?: number; // Timestamp when card should be reviewed next
    isNew?: boolean; // True for cards never reviewed before
  };
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// SM-2 Algorithm Constants
const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const EASE_FACTOR_DECREMENT = 0.2;

// SM-2 Algorithm: Calculate next interval based on performance
function calculateSM2Interval(repetition: number, easeFactor: number, quality: number): number {
  if (quality < 3) {
    // Failed response - reset to 1 day
    return 1;
  }

  if (repetition === 0) {
    return 1; // First success
  } else if (repetition === 1) {
    return 6; // Second success
  } else {
    // Subsequent successes: multiply previous interval by ease factor
    return Math.ceil(repetition * easeFactor);
  }
}

// SM-2 Algorithm: Calculate new ease factor
function calculateSM2EaseFactor(currentEaseFactor: number, quality: number): number {
  if (quality < 3) {
    // Failed response - decrease ease factor
    return Math.max(MIN_EASE_FACTOR, currentEaseFactor - EASE_FACTOR_DECREMENT);
  } else {
    // Success - adjust ease factor based on quality
    const adjustment = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    return Math.max(MIN_EASE_FACTOR, currentEaseFactor + adjustment);
  }
}

// Initialize SM-2 data for a new card
function initializeSM2Data(): {
  interval: number;
  easeFactor: number;
  repetition: number;
  nextReviewDate: number;
  isNew: boolean;
} {
  return {
    interval: 0, // New cards are due immediately
    easeFactor: INITIAL_EASE_FACTOR,
    repetition: 0,
    nextReviewDate: Date.now(), // Due now
    isNew: true,
  };
}

// Update SM-2 data after a review
function updateSM2Data(currentData: ProgressData[string], quality: number): {
  interval: number;
  easeFactor: number;
  repetition: number;
  nextReviewDate: number;
  isNew: boolean;
} {
  const newEaseFactor = calculateSM2EaseFactor(currentData.easeFactor ?? INITIAL_EASE_FACTOR, quality);
  const newRepetition = quality < 3 ? 0 : (currentData.repetition ?? 0) + 1;
  const newInterval = calculateSM2Interval(newRepetition, newEaseFactor, quality);

  // Calculate next review date (in milliseconds)
  const now = Date.now();
  const nextReviewDate = now + (newInterval * 24 * 60 * 60 * 1000);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetition: newRepetition,
    nextReviewDate,
    isNew: false,
  };
}

// Get shuffled vocabulary
export function getShuffledVocabulary(): VocabularyItem[] {
  return shuffleArray(vocabulary);
}

// Load progress from AsyncStorage
export async function loadProgress(): Promise<ProgressData> {
  try {
    // Add timeout for web environments
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Storage timeout")), 2000)
    );

    const dataPromise = AsyncStorage.getItem(PROGRESS_KEY);
    const data = await Promise.race([dataPromise, timeoutPromise]);

    const progress = data ? JSON.parse(data) : {};

    // Migrate legacy data to SM-2 format if needed
    const now = Date.now();

    // Check if this is a new user (no progress data)
    const isNewUser = Object.keys(progress).length === 0;

    // For new users, only introduce a few cards per day
    let cardsIntroducedToday = 0;
    const MAX_NEW_CARDS_PER_DAY = 5;

    Object.keys(progress).forEach(id => {
      const item = progress[id];

      // If SM-2 fields are missing, initialize them
      if (item.interval === undefined) {
        if (item.forgotCount > 0) {
          // Cards with forgot history - schedule for review soon (1 day) to reinforce learning
          progress[id] = {
            ...item,
            ...initializeSM2Data(),
            isNew: false,
            nextReviewDate: now + (1 * 24 * 60 * 60 * 1000), // 1 day from now
          };
        } else if (isNewUser && cardsIntroducedToday < MAX_NEW_CARDS_PER_DAY) {
          // New user - introduce just a few cards today
          progress[id] = {
            ...item,
            ...initializeSM2Data(),
          };
          cardsIntroducedToday++;
        } else {
          // New user but already introduced max cards, or existing user
          progress[id] = {
            ...item,
            ...initializeSM2Data(),
            isNew: true,
            nextReviewDate: now + (365 * 24 * 60 * 60 * 1000), // Far future for new cards
          };
        }
      }
    });

    return progress;
  } catch (error) {
    console.warn("Error loading progress (using empty):", error);
    return {};
  }
}

// Save progress to AsyncStorage
export async function saveProgress(progress: ProgressData): Promise<void> {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn("Error saving progress:", error);
  }
}

// Load current index
export async function loadCurrentIndex(): Promise<number> {
  try {
    // Add timeout for web environments
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Storage timeout")), 2000)
    );

    const dataPromise = AsyncStorage.getItem(CURRENT_INDEX_KEY);
    const data = await Promise.race([dataPromise, timeoutPromise]);

    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.warn("Error loading current index (using 0):", error);
    return 0;
  }
}

// Save current index
export async function saveCurrentIndex(index: number): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENT_INDEX_KEY, index.toString());
  } catch (error) {
    console.warn("Error saving current index:", error);
  }
}

// Streak data interface
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string; // YYYY-MM-DD format
}

// Load streak data
export async function loadStreak(): Promise<StreakData> {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    return data ? JSON.parse(data) : {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null
    };
  } catch (error) {
    console.warn("Error loading streak:", error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null
    };
  }
}

// Save streak data
export async function saveStreak(streak: StreakData): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch (error) {
    console.warn("Error saving streak:", error);
  }
}

// Update streak when daily goal is completed
export async function updateStreakForGoalCompletion(): Promise<StreakData> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const currentStreak = await loadStreak();

  let newStreak: StreakData;

  if (currentStreak.lastCompletedDate === today) {
    // Already completed today, no change
    newStreak = currentStreak;
  } else if (currentStreak.lastCompletedDate === getYesterdayDate()) {
    // Completed yesterday, extend streak
    newStreak = {
      currentStreak: currentStreak.currentStreak + 1,
      longestStreak: Math.max(currentStreak.longestStreak, currentStreak.currentStreak + 1),
      lastCompletedDate: today
    };
  } else {
    // Streak broken, start new streak
    newStreak = {
      currentStreak: 1,
      longestStreak: Math.max(currentStreak.longestStreak, 1),
      lastCompletedDate: today
    };
  }

  await saveStreak(newStreak);
  return newStreak;
}

function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

// Mark word as remembered (quality = 4 for "correct with some hesitation")
export async function markRemembered(
  id: string,
  progress: ProgressData
): Promise<ProgressData> {
  const current = progress[id] || { forgotCount: 0, lastReviewed: 0 };
  const sm2Update = updateSM2Data(current, 4); // Quality 4 = correct

  const newProgress = {
    ...progress,
    [id]: {
      // Keep legacy fields for backward compatibility
      forgotCount: Math.max(0, current.forgotCount - 1),
      lastReviewed: Date.now(),
      veryFamiliar: false, // Reset very familiar flag

      // SM-2 fields
      ...sm2Update,
    },
  };
  await saveProgress(newProgress);
  return newProgress;
}

// Mark word as forgot (quality = 1 for "incorrect, but remembered the answer")
export async function markForgot(
  id: string,
  progress: ProgressData
): Promise<ProgressData> {
  const current = progress[id] || { forgotCount: 0, lastReviewed: 0 };
  const sm2Update = updateSM2Data(current, 1); // Quality 1 = forgot

  // For forgotten words, ensure they appear in the next learning session
  // Override the SM-2 interval to be more aggressive for reinforcement
  const now = Date.now();
  const nextReviewDate = now + (4 * 60 * 60 * 1000); // 4 hours from now for quick review

  const newProgress = {
    ...progress,
    [id]: {
      // Keep legacy fields for backward compatibility
      forgotCount: current.forgotCount + 1,
      lastReviewed: now,
      veryFamiliar: false, // Reset very familiar flag when marked as forgot

      // SM-2 fields with adjusted timing for forgotten words
      ...sm2Update,
      nextReviewDate, // Override with shorter interval for immediate reinforcement
    },
  };
  await saveProgress(newProgress);
  return newProgress;
}

// Mark word as very familiar (quality = 5 for "perfect response")
export async function markVeryFamiliar(
  id: string,
  progress: ProgressData
): Promise<ProgressData> {
  const current = progress[id] || { forgotCount: 0, lastReviewed: 0 };
  const sm2Update = updateSM2Data(current, 5); // Quality 5 = perfect

  const newProgress = {
    ...progress,
    [id]: {
      // Keep legacy fields for backward compatibility
      forgotCount: current.forgotCount,
      lastReviewed: Date.now(),
      veryFamiliar: true,

      // SM-2 fields
      ...sm2Update,
    },
  };
  await saveProgress(newProgress);
  return newProgress;
}

// Restore word from very familiar back to active learning
export async function restoreFromFamiliar(
  id: string,
  progress: ProgressData
): Promise<ProgressData> {
  const current = progress[id] || { forgotCount: 0, lastReviewed: 0 };
  const newProgress = {
    ...progress,
    [id]: {
      forgotCount: current.forgotCount,
      lastReviewed: Date.now(),
      veryFamiliar: false,
    },
  };
  await saveProgress(newProgress);
  return newProgress;
}

// Get forgot list sorted by forgot count (descending)
export function getForgotList(progress: ProgressData): Array<{
  item: VocabularyItem;
  forgotCount: number;
}> {
  return vocabulary
    .filter((item) => progress[item.id]?.forgotCount > 0)
    .map((item) => ({
      item,
      forgotCount: progress[item.id].forgotCount,
    }))
    .sort((a, b) => b.forgotCount - a.forgotCount);
}

// Get familiar words list (words marked as very familiar)
export function getFamiliarList(progress: ProgressData): VocabularyItem[] {
  return vocabulary
    .filter((item) => progress[item.id]?.veryFamiliar === true)
    .sort((a, b) => {
      const aTime = progress[a.id]?.lastReviewed || 0;
      const bTime = progress[b.id]?.lastReviewed || 0;
      return bTime - aTime; // Most recently marked familiar first
    });
}

// Get cards that are due for review (overdue or due today)
export function getDueCards(progress: ProgressData): VocabularyItem[] {
  const now = Date.now();

  return vocabulary.filter(item => {
    const itemProgress = progress[item.id];
    if (!itemProgress) return true; // New cards are always due

    // Card is due if nextReviewDate has passed
    return (itemProgress.nextReviewDate || 0) <= now;
  });
}

// Get new cards (never reviewed before)
export function getNewCards(progress: ProgressData): VocabularyItem[] {
  return vocabulary.filter(item => {
    const itemProgress = progress[item.id];
    return !itemProgress || itemProgress.isNew === true;
  });
}

// Get cards for the main learning flow (SM-2 scheduled, limited number)
export function getLearningQueue(progress: ProgressData, maxCards: number = 20): VocabularyItem[] {
  const now = Date.now();

  // Get all due cards (including forgotten words that are now due)
  const dueCards = getDueCards(progress);

  // Prioritize recently forgotten words (forgot in last 24 hours)
  const recentlyForgotten = vocabulary.filter(item => {
    const itemProgress = progress[item.id];
    if (!itemProgress) return false;

    // Check if forgotten recently (within last 24 hours)
    const timeSinceForgot = now - itemProgress.lastReviewed;
    const wasRecentlyForgotten = timeSinceForgot < (24 * 60 * 60 * 1000) && itemProgress.forgotCount > 0;

    return wasRecentlyForgotten;
  });

  // Combine: recently forgotten first, then other due cards, then new cards
  const prioritizedCards = [...recentlyForgotten, ...dueCards.filter(card =>
    !recentlyForgotten.some(recent => recent.id === card.id)
  )];

  const availableSlots = Math.max(0, maxCards - prioritizedCards.length);
  const newCards = getNewCards(progress).slice(0, availableSlots);

  // Combine prioritized cards + limited new cards, shuffle within groups but maintain priority
  const allCards = [...prioritizedCards, ...newCards];
  return allCards.sort(() => Math.random() - 0.5);
}

// Get cards that are due soon (within next 24 hours) for notifications
export function getCardsDueSoon(progress: ProgressData, hoursAhead: number = 24): VocabularyItem[] {
  const now = Date.now();
  const futureTime = now + (hoursAhead * 60 * 60 * 1000);

  return vocabulary.filter(item => {
    const itemProgress = progress[item.id];
    if (!itemProgress || itemProgress.isNew) return false; // Skip new cards

    const nextReview = itemProgress.nextReviewDate || 0;
    return nextReview > now && nextReview <= futureTime;
  });
}

// Debug function to check forgotten words scheduling
export function debugForgottenWords(progress: ProgressData): {
  totalForgotten: number;
  recentlyForgotten: number;
  scheduledForReview: number;
  nextReviewTimes: Array<{word: string, hoursUntilReview: number}>;
} {
  const now = Date.now();
  const forgottenWords = vocabulary.filter(item => {
    const progress = progress[item.id];
    return progress && progress.forgotCount > 0;
  });

  const recentlyForgotten = forgottenWords.filter(item => {
    const progress = progress[item.id];
    const timeSinceForgot = now - (progress?.lastReviewed || 0);
    return timeSinceForgot < (24 * 60 * 60 * 1000);
  });

  const scheduledForReview = forgottenWords.filter(item => {
    const progress = progress[item.id];
    return (progress?.nextReviewDate || 0) <= now + (24 * 60 * 60 * 1000);
  });

  const nextReviewTimes = forgottenWords
    .filter(item => {
      const progress = progress[item.id];
      return progress && progress.nextReviewDate;
    })
    .map(item => {
      const progress = progress[item.id];
      const hoursUntilReview = Math.max(0, Math.round((progress!.nextReviewDate! - now) / (60 * 60 * 1000)));
      return { word: item.french, hoursUntilReview };
    })
    .sort((a, b) => a.hoursUntilReview - b.hoursUntilReview)
    .slice(0, 5); // Show next 5

  return {
    totalForgotten: forgottenWords.length,
    recentlyForgotten: recentlyForgotten.length,
    scheduledForReview: scheduledForReview.length,
    nextReviewTimes
  };
}

// Get learning statistics
export function getLearningStats(progress: ProgressData): {
  totalCards: number;
  learnedCards: number;
  dueCards: number;
  newCards: number;
  masteryPercentage: number;
} {
  const totalCards = vocabulary.length;
  const learnedCards = Object.keys(progress).filter(id => (progress[id].repetition ?? 0) > 0).length;
  const dueCards = getDueCards(progress).length;
  const newCards = getNewCards(progress).length;
  const masteryPercentage = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0;

  return {
    totalCards,
    learnedCards,
    dueCards,
    newCards,
    masteryPercentage,
  };
}

// Reset all progress
export async function resetProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROGRESS_KEY);
    await AsyncStorage.removeItem(CURRENT_INDEX_KEY);
  } catch (error) {
    console.error("Error resetting progress:", error);
  }
}
