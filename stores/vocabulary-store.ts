import AsyncStorage from "@react-native-async-storage/async-storage";
import { vocabulary, VocabularyItem } from "../data/vocabulary";

const PROGRESS_KEY = "frenchie_progress";
const CURRENT_INDEX_KEY = "frenchie_current_index";

export interface ProgressData {
  [id: string]: {
    forgotCount: number;
    lastReviewed: number;
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
    const data = await AsyncStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error loading progress:", error);
    return {};
  }
}

// Save progress to AsyncStorage
export async function saveProgress(progress: ProgressData): Promise<void> {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

// Load current index
export async function loadCurrentIndex(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(CURRENT_INDEX_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error("Error loading current index:", error);
    return 0;
  }
}

// Save current index
export async function saveCurrentIndex(index: number): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENT_INDEX_KEY, index.toString());
  } catch (error) {
    console.error("Error saving current index:", error);
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

// Reset all progress
export async function resetProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROGRESS_KEY);
    await AsyncStorage.removeItem(CURRENT_INDEX_KEY);
  } catch (error) {
    console.error("Error resetting progress:", error);
  }
}
