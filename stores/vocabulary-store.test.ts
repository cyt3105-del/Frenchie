import { describe, it, expect, vi } from "vitest";
import {
  getShuffledVocabulary,
  getForgotList,
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
});
