import {
  createCallbackRequest,
  getPendingCallbackRequests,
  getCallbackRequestById,
  assignCallbackRequest,
  completeCallbackRequest,
  cancelCallbackRequest,
  getUserCallbackRequests,
  notifyOperators,
} from "../../src/services/callback";

describe("Callback Service", () => {
  describe("createCallbackRequest", () => {
    it("should create a new callback request with pending status", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [
            {
              id: 1,
              user_id: 123,
              operator_id: null,
              message: "Need help",
              status: "pending",
              created_at: new Date("2026-01-01"),
              updated_at: null,
            },
          ],
        }),
      };

      const request = await createCallbackRequest(mockPool, 123, "Need help");

      expect(request.id).toBe(1);
      expect(request.user_id).toBe(123);
      expect(request.message).toBe("Need help");
      expect(request.status).toBe("pending");
      expect(request.operator_id).toBeNull();
    });
  });

  describe("getPendingCallbackRequests", () => {
    it("should return only pending requests", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [
            { id: 1, user_id: 123, message: "Help", status: "pending", operator_id: null, created_at: new Date(), updated_at: null },
            { id: 2, user_id: 456, message: "Support", status: "pending", operator_id: null, created_at: new Date(), updated_at: null },
          ],
        }),
      };

      const requests = await getPendingCallbackRequests(mockPool);

      expect(requests.length).toBe(2);
      expect(requests[0].status).toBe("pending");
      expect(requests[1].status).toBe("pending");
    });

    it("should return empty array when no pending requests", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const requests = await getPendingCallbackRequests(mockPool);

      expect(requests.length).toBe(0);
    });
  });

  describe("getCallbackRequestById", () => {
    it("should return existing request", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, user_id: 123, message: "Help", status: "pending", operator_id: null, created_at: new Date(), updated_at: null }],
        }),
      };

      const request = await getCallbackRequestById(mockPool, 1);

      expect(request).not.toBeNull();
      expect(request?.id).toBe(1);
      expect(request?.message).toBe("Help");
    });

    it("should return null for non-existing request", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const request = await getCallbackRequestById(mockPool, 999);

      expect(request).toBeNull();
    });
  });

  describe("assignCallbackRequest", () => {
    it("should atomically assign pending request to operator", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, user_id: 123, operator_id: 5, message: "Help", status: "in_progress", created_at: new Date(), updated_at: new Date() }],
        }),
      };

      const request = await assignCallbackRequest(mockPool, 1, 5);

      expect(request).not.toBeNull();
      expect(request?.operator_id).toBe(5);
      expect(request?.status).toBe("in_progress");
    });

    it("should return null if already taken", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const request = await assignCallbackRequest(mockPool, 1, 5);

      expect(request).toBeNull();
    });
  });

  describe("completeCallbackRequest", () => {
    it("should mark in_progress request as completed", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, user_id: 123, operator_id: 5, status: "completed", message: "Help", created_at: new Date(), updated_at: new Date() }],
        }),
      };

      const request = await completeCallbackRequest(mockPool, 1);

      expect(request).not.toBeNull();
      expect(request?.status).toBe("completed");
    });

    it("should return null if not in_progress", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const request = await completeCallbackRequest(mockPool, 999);

      expect(request).toBeNull();
    });
  });

  describe("cancelCallbackRequest", () => {
    it("should cancel a pending request", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [{ id: 1, user_id: 123, status: "cancelled", message: "Help", created_at: new Date(), updated_at: new Date() }],
        }),
      };

      const request = await cancelCallbackRequest(mockPool, 1);

      expect(request).not.toBeNull();
      expect(request?.status).toBe("cancelled");
    });

    it("should return null if already completed", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const request = await cancelCallbackRequest(mockPool, 999);

      expect(request).toBeNull();
    });
  });

  describe("getUserCallbackRequests", () => {
    it("should return all requests for a user", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [
            { id: 2, user_id: 123, message: "Support", status: "completed", operator_id: null, created_at: new Date(), updated_at: new Date() },
            { id: 1, user_id: 123, message: "Help", status: "pending", operator_id: null, created_at: new Date(), updated_at: null },
          ],
        }),
      };

      const requests = await getUserCallbackRequests(mockPool, 123);

      expect(requests.length).toBe(2);
      expect(requests[0].user_id).toBe(123);
    });
  });

  describe("notifyOperators", () => {
    it("should notify all active operators", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [
            { id: 1, user_id: 100 },
            { id: 2, user_id: 200 },
          ],
        }),
      };

      const sentTo: number[] = [];
      const mockTelegram = {
        sendMessage: async (chatId: number) => { sentTo.push(chatId); },
      };

      const request = {
        id: 1,
        user_id: 123,
        operator_id: null,
        message: "Help me",
        status: "pending" as const,
        created_at: new Date(),
        updated_at: null,
      };

      await notifyOperators(mockPool, mockTelegram as any, request as any);

      expect(sentTo).toContain(100);
      expect(sentTo).toContain(200);
    });

    it("should not fail when no active operators", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };

      const mockTelegram = {
        sendMessage: async () => { throw new Error("Should not be called"); },
      };

      const request = {
        id: 1,
        user_id: 123,
        operator_id: null,
        message: "Help me",
        status: "pending" as const,
        created_at: new Date(),
        updated_at: null,
      };

      await expect(notifyOperators(mockPool, mockTelegram as any, request as any)).resolves.toBeUndefined();
    });
  });
});
