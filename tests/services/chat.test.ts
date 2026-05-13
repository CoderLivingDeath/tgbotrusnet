import { isUserBanned } from "../../src/services/chat";

describe("Chat Service", () => {
  describe("isUserBanned", () => {
    it("should return true for banned user", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [{ id: 1 }] }),
      };

      const result = await isUserBanned(mockPool, 456);

      expect(result).toBe(true);
    });

    it("should return false for non-banned user", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const result = await isUserBanned(mockPool, 456);

      expect(result).toBe(false);
    });
  });
});
