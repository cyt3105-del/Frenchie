import { describe, it, expect, vi } from "vitest";
import {
  getShuffledVocabulary,
  getForgotList,
  markRemembered,
  markForgot,
  getDueCards,
  getNewCards,
  getLearningStats,
  ProgressData,
} from "./vocabulary-store";
import { vocabulary } from "../data/vocabulary";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("vocabulary-store", () => {
  describe("getShuffledVocabulary", () => {
    it("should return all vocabulary items", () => {
      const shuffled = getShuffledVocabulary();
      expect(shuffled.length).toBe(vocabulary.length);
    });

    it("should contain all original items", () => {
      const shuffled = getShuffledVocabulary();
      const originalIds = vocabulary.map((v) => v.id).sort();
      const shuffledIds = shuffled.map((v) => v.id).sort();
      expect(shuffledIds).toEqual(originalIds);
    });

    it("should return items with correct structure", () => {
      const shuffled = getShuffledVocabulary();
      const item = shuffled[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("french");
      expect(item).toHaveProperty("english");
      expect(item).toHaveProperty("exampleFr");
      expect(item).toHaveProperty("exampleEn");
      expect(item).toHaveProperty("level");
      expect(item).toHaveProperty("category");
    });
  });

  describe("getForgotList", () => {
    it("should return empty array when no progress", () => {
      const progress: ProgressData = {};
      const forgotList = getForgotList(progress);
      expect(forgotList).toEqual([]);
    });

    it("should return empty array when all forgot counts are 0", () => {
      const progress: ProgressData = {
        "a2-001": { forgotCount: 0, lastReviewed: Date.now() },
        "a2-002": { forgotCount: 0, lastReviewed: Date.now() },
      };
      const forgotList = getForgotList(progress);
      expect(forgotList).toEqual([]);
    });

    it("should return items with forgot count > 0", () => {
      const progress: ProgressData = {
        "a2-001": { forgotCount: 2, lastReviewed: Date.now() },
        "a2-002": { forgotCount: 0, lastReviewed: Date.now() },
        "a2-003": { forgotCount: 1, lastReviewed: Date.now() },
      };
      const forgotList = getForgotList(progress);
      expect(forgotList.length).toBe(2);
    });

    it("should sort by forgot count descending", () => {
      const progress: ProgressData = {
        "a2-001": { forgotCount: 2, lastReviewed: Date.now() },
        "a2-002": { forgotCount: 5, lastReviewed: Date.now() },
        "a2-003": { forgotCount: 1, lastReviewed: Date.now() },
      };
      const forgotList = getForgotList(progress);
      expect(forgotList[0].forgotCount).toBe(5);
      expect(forgotList[1].forgotCount).toBe(2);
      expect(forgotList[2].forgotCount).toBe(1);
    });

    it("should include correct vocabulary item with forgot count", () => {
      const progress: ProgressData = {
        "a2-001": { forgotCount: 3, lastReviewed: Date.now() },
      };
      const forgotList = getForgotList(progress);
      expect(forgotList.length).toBe(1);
      expect(forgotList[0].item.id).toBe("a2-001");
      expect(forgotList[0].forgotCount).toBe(3);
    });
  });

  describe("vocabulary data", () => {
    it("should have A2, B1, and B2 level words", () => {
      const levels = new Set(vocabulary.map((v) => v.level));
      expect(levels.has("A2")).toBe(true);
      expect(levels.has("B1")).toBe(true);
      expect(levels.has("B2")).toBe(true);
    });

    it("should have words, phrases, and expressions", () => {
      const categories = new Set(vocabulary.map((v) => v.category));
      expect(categories.has("word")).toBe(true);
      expect(categories.has("phrase")).toBe(true);
      expect(categories.has("expression")).toBe(true);
    });

    it("should have at least 50 vocabulary items", () => {
      expect(vocabulary.length).toBeGreaterThanOrEqual(50);
    });

    it("should have unique IDs for all items", () => {
      const ids = vocabulary.map((v) => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("SM-2 Spaced Repetition", () => {
    describe("markRemembered", () => {
      it("should update SM-2 data for successful review", async () => {
        const mockProgress = {
          'test-id': {
            forgotCount: 0,
            lastReviewed: 1000,
            interval: 1,
            easeFactor: 2.5,
            repetition: 0,
            nextReviewDate: Date.now() - 1000,
            isNew: false
          },
        };

        const result = await markRemembered('test-id', mockProgress);
        expect(result['test-id'].forgotCount).toBe(0);
        expect(result['test-id'].lastReviewed).toBeGreaterThan(1000);
        expect(result['test-id'].repetition).toBe(1);
        expect(result['test-id'].nextReviewDate).toBeGreaterThan(Date.now());
      });
    });

    describe("markForgot", () => {
      it("should reset SM-2 repetition for failed review", async () => {
        const mockProgress = {
          'test-id': {
            forgotCount: 0,
            lastReviewed: 1000,
            interval: 6,
            easeFactor: 2.5,
            repetition: 2,
            nextReviewDate: Date.now(),
            isNew: false
          },
        };

        const result = await markForgot('test-id', mockProgress);
        expect(result['test-id'].forgotCount).toBe(1);
        expect(result['test-id'].repetition).toBe(0);
        expect(result['test-id'].interval).toBe(1); // Reset to 1 day
      });
    });

    describe("getDueCards", () => {
      it("should return cards that are due for review", () => {
        const now = Date.now();
        const progress: ProgressData = {
          'card1': {
            forgotCount: 0,
            lastReviewed: now,
            nextReviewDate: now - 1000, // Due (past)
            interval: 1,
            easeFactor: 2.5,
            repetition: 1,
            isNew: false
          },
          'card2': {
            forgotCount: 0,
            lastReviewed: now,
            nextReviewDate: now + 86400000, // Not due (future)
            interval: 1,
            easeFactor: 2.5,
            repetition: 1,
            isNew: false
          },
        };

        const dueCards = getDueCards(progress);
        // Should include card1 and any new cards from vocabulary
        const dueCardIds = dueCards.map(card => card.id);
        expect(dueCardIds).toContain('card1');
        expect(dueCardIds).not.toContain('card2');
      });

      it("should include new cards (never reviewed)", () => {
        const progress: ProgressData = {
          // No progress data - all cards should be due
        };

        const dueCards = getDueCards(progress);
        expect(dueCards.length).toBe(vocabulary.length);
      });
    });

    describe("getNewCards", () => {
      it("should return cards marked as new or never reviewed", () => {
        const progress: ProgressData = {
          'card1': {
            forgotCount: 0,
            lastReviewed: Date.now(),
            isNew: false,
            interval: 1,
            easeFactor: 2.5,
            repetition: 1,
            nextReviewDate: Date.now()
          },
          'card2': {
            forgotCount: 0,
            lastReviewed: Date.now(),
            isNew: true, // Explicitly new
            interval: 0,
            easeFactor: 2.5,
            repetition: 0,
            nextReviewDate: Date.now()
          },
        };

        const newCards = getNewCards(progress);
        const newCardIds = newCards.map(card => card.id);
        expect(newCardIds).toContain('card2');
        expect(newCardIds).not.toContain('card1');
      });
    });

    describe("getLearningStats", () => {
      it("should calculate learning statistics correctly", () => {
        const progress: ProgressData = {
          'card1': {
            forgotCount: 0,
            lastReviewed: Date.now(),
            repetition: 2, // Learned
            interval: 6,
            easeFactor: 2.5,
            nextReviewDate: Date.now(),
            isNew: false
          },
          'card2': {
            forgotCount: 0,
            lastReviewed: Date.now(),
            repetition: 0, // Not learned
            interval: 1,
            easeFactor: 2.5,
            nextReviewDate: Date.now(),
            isNew: true
          },
        };

        const stats = getLearningStats(progress);
        expect(stats.totalCards).toBe(vocabulary.length);
        expect(stats.learnedCards).toBe(1); // Only card1 has repetition > 0
        expect(stats.dueCards).toBeGreaterThanOrEqual(0);
        expect(stats.newCards).toBeGreaterThanOrEqual(0);
        expect(stats.masteryPercentage).toBeGreaterThanOrEqual(0);
        expect(stats.masteryPercentage).toBeLessThanOrEqual(100);
      });
    });
  });
});
