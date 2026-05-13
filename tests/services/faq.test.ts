import { searchFAQs, getFAQById, searchFaqs } from "../../src/services/faq";

describe("FAQ Service", () => {
  describe("searchFAQs", () => {
    it("should return matching FAQs", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, category_id: 1, question: "Test Q", answer: "Test A" }],
        }),
      };

      const results = await searchFAQs(mockPool, "Test");

      expect(results.length).toBe(1);
    });

    it("should return empty array for no matches", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const results = await searchFAQs(mockPool, "nonexistent");

      expect(results.length).toBe(0);
    });
  });

  describe("getFAQById", () => {
    it("should return FAQ by id", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, category_id: 1, question: "Q", answer: "A" }],
        }),
      };

      const result = await getFAQById(mockPool, 1);
      expect(result).not.toBe(null);
      expect(result?.id).toBe(1);
    });

    it("should return null for non-existing id", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const result = await getFAQById(mockPool, 999);
      expect(result).toBe(null);
    });
  });

  describe("searchFaqs", () => {
    it("should return matching FAQs", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, question: "Test", answer: "Answer" }],
        }),
      };

      const results = await searchFaqs(mockPool, "Test");
      expect(results.length).toBe(1);
    });

    it("should return empty array for no matches", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const results = await searchFaqs(mockPool, "xyz");
      expect(results.length).toBe(0);
    });
  });
});
