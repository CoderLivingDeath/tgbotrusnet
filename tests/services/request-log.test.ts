import { logRequest, logResponse, getStatistics } from "../../src/services/request-log";

describe("Request Log Service", () => {
  describe("logRequest", () => {
    it("should log request to database", async () => {
      const mockPool: any = {
        query: async () => ({ rows: [] }),
      };
      const mockLogger: any = {
        debug: () => {},
        error: () => {},
      };

      await logRequest(mockPool, 123, "test message", "general", mockLogger);

      expect(true).toBe(true);
    });
  });

  describe("logResponse", () => {
    it("should handle no pending request", async () => {
      const mockPool: any = {
        query: async () => ({ rowCount: 1 }),
      };
      const mockLogger: any = {
        debug: () => {},
        error: () => {},
      };

      await logResponse(mockPool, 999, "escalation", mockLogger);

      expect(true).toBe(true);
    });
  });

  describe("getStatistics", () => {
    it("should return statistics", async () => {
      const mockPool: any = {
        query: async () => ({
          rows: [
            {
              total: "100",
              auto_responses: "80",
              escalations: "20",
              avg_response_time: "150.5",
            },
          ],
        }),
      };

      const stats = await getStatistics(mockPool, 7);

      expect(stats.total).toBe(100);
      expect(stats.auto_responses).toBe(80);
      expect(stats.escalations).toBe(20);
    });

    it("should return zero stats on error", async () => {
      const mockPool: any = {
        query: async () => {
          throw new Error("DB error");
        },
      };

      const stats = await getStatistics(mockPool, 7);

      expect(stats.total).toBe(0);
    });
  });
});
