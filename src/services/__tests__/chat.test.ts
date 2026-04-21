import { startChat, sendMessage, endChat, banUser, isUserBanned } from "../chat";

describe("Chat Service", () => {
  describe("startChat", () => {
    it("should create a new chat", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [
            {
              id: 1,
              user_id: 123,
              operator_id: null,
              status: "waiting",
              category: null,
            },
          ],
        }),
      };

      const chat = await startChat(mockPool, 123, "general");

      expect(chat.id).toBe(1);
      expect(chat.status).toBe("waiting");
    });
  });

  describe("sendMessage", () => {
    it("should save message to database", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, text: "Hello" }],
        }),
      };

      const message = await sendMessage(mockPool, 1, "user", "Hello");

      expect(message.text).toBe("Hello");
    });
  });

  describe("endChat", () => {
    it("should close the chat", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, status: "closed" }],
        }),
      };

      const chat = await endChat(mockPool, 1);

      expect(chat?.status).toBe("closed");
    });

    it("should return null for non-existent chat", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const chat = await endChat(mockPool, 999);

      expect(chat).toBe(null);
    });
  });

  describe("banUser", () => {
    it("should ban user successfully", async () => {
      const mockPool: any = {
        query: async () => ({ rowCount: 1 }),
      };

      const result = await banUser(mockPool, 456, "spam");

      expect(result).toBe(true);
    });
  });

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