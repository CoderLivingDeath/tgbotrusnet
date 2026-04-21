import { searchFAQs } from "../../services/faq";

describe("FAQ Service", () => {
  describe("searchFAQs", () => {
    it("should return matching FAQs", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, category_id: 1, question: "Test Q", answer: "Test A" }],
        }),
      };

      const results = await searchFAQs(mockPool, "Test");

      expect(results.length).toBeGreaterThan(0);
    });

    it("should return empty array for no matches", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const results = await searchFAQs(mockPool, "nonexistent");

      expect(results.length).toBe(0);
    });
  });
});