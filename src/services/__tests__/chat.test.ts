import { startChat, sendMessage, endChat, banUser, isUserBanned, getChatById, getChatsByUser, updateChat } from "../chat";

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

  describe("getChatById", () => {
    it("should return existing chat", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, user_id: 123, status: "active" }],
        }),
      };

      const chat = await getChatById(mockPool, 1);
      expect(chat).not.toBe(null);
      expect(chat?.id).toBe(1);
    });

    it("should return null for non-existing chat", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const chat = await getChatById(mockPool, 999);
      expect(chat).toBe(null);
    });
  });

  describe("getChatsByUser", () => {
    it("should return user's chats", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [
            { id: 1, user_id: 123, status: "active" },
            { id: 2, user_id: 123, status: "closed" },
          ],
        }),
      };

      const chats = await getChatsByUser(mockPool, 123);
      expect(chats.length).toBe(2);
      expect(chats[0].user_id).toBe(123);
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

  describe("updateChat", () => {
    it("should update existing chat", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, status: "active", category: "support" }],
        }),
      };

      const chat = await updateChat(mockPool, 1, { status: "active", category: "support" });
      expect(chat).not.toBe(null);
      expect(chat?.status).toBe("active");
    });
  });
});