import AsyncStorage from "@react-native-async-storage/async-storage";
import { vocabulary, VocabularyItem } from "../data/vocabulary";

const PROGRESS_KEY = "frenchie_progress";
const CURRENT_INDEX_KEY = "frenchie_current_index";

export interface ProgressData {
  [id: string]: {
    forgotCount: number;
    lastReviewed: number;
    veryFamiliar?: boolean;
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

    return data ? JSON.parse(data) : {};
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

// Mark word as remembered
export async function markRemembered(
  id: string,
  progress: ProgressData
): Promise<ProgressData> {
  const current = progress[id] || { forgotCount: 0, lastReviewed: 0 };
  const newProgress = {
    ...progress,
    [id]: {
      forgotCount: Math.max(0, current.forgotCount - 1),
      lastReviewed: Date.now(),
    },
  };
  await saveProgress(newProgress);
  return newProgress;
}

// Mark word as forgot
export async function markForgot(
  id: string,
  progress: ProgressData
): Promise<ProgressData> {
  const current = progress[id] || { forgotCount: 0, lastReviewed: 0 };
  const newProgress = {
    ...progress,
    [id]: {
      forgotCount: current.forgotCount + 1,
      lastReviewed: Date.now(),
      veryFamiliar: false, // Reset very familiar flag when marked as forgot
    },
  };
  await saveProgress(newProgress);
  return newProgress;
}

// Mark word as very familiar
export async function markVeryFamiliar(
  id: string,
  progress: ProgressData
): Promise<ProgressData> {
  const current = progress[id] || { forgotCount: 0, lastReviewed: 0 };
  const newProgress = {
    ...progress,
    [id]: {
      forgotCount: current.forgotCount,
      lastReviewed: Date.now(),
      veryFamiliar: true,
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

// Reset all progress
export async function resetProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROGRESS_KEY);
    await AsyncStorage.removeItem(CURRENT_INDEX_KEY);
  } catch (error) {
    console.error("Error resetting progress:", error);
  }
}
