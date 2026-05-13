import { validateUserData, validateChatData, validateFaqData } from "../../src/services/schema";

describe("Schema Validation", () => {
  describe("validateUserData", () => {
    it("should accept valid user data", () => {
      const result = validateUserData({ user_id: 123, password_hash: "hash123" });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should reject invalid user data", () => {
      const result = validateUserData({ user_id: -1, password_hash: "" });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject missing user_id", () => {
      const result = validateUserData({ password_hash: "hash" });
      expect(result.valid).toBe(false);
    });
  });

  describe("validateChatData", () => {
    it("should accept valid chat data", () => {
      const result = validateChatData({ user_id: 123, status: "active", category: "support" });
      expect(result.valid).toBe(true);
    });

    it("should reject invalid chat data", () => {
      const result = validateChatData({ user_id: -1, status: "invalid_status" });
      expect(result.valid).toBe(false);
    });

    it("should reject missing user_id", () => {
      const result = validateChatData({ status: "waiting" });
      expect(result.valid).toBe(false);
    });
  });

  describe("validateFaqData", () => {
    it("should accept valid FAQ data", () => {
      const result = validateFaqData({ category_id: 1, question: "What is this?", answer: "It is something." });
      expect(result.valid).toBe(true);
    });

    it("should reject invalid FAQ data", () => {
      const result = validateFaqData({ category_id: -1, question: "", answer: "" });
      expect(result.valid).toBe(false);
    });

    it("should reject missing question", () => {
      const result = validateFaqData({ category_id: 1, answer: "Answer" });
      expect(result.valid).toBe(false);
    });

    it("should reject missing answer", () => {
      const result = validateFaqData({ category_id: 1, question: "Question" });
      expect(result.valid).toBe(false);
    });
  });
});
