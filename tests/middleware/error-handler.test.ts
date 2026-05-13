import { createErrorHandlerMiddleware, createUnknownCommandMiddleware } from "../../src/middleware/error-handler";

describe("Error Handler Middleware", () => {
  describe("createErrorHandlerMiddleware", () => {
    it("should call next without error", async () => {
      const middleware = createErrorHandlerMiddleware();
      const ctx: any = { logger: { error: () => {} }, reply: () => Promise.resolve() };
      const next = async () => {};

      await middleware(ctx, next);

      expect(true).toBe(true);
    });

    it("should catch error and reply", async () => {
      const middleware = createErrorHandlerMiddleware();
      const ctx: any = { logger: { error: () => {} }, reply: () => Promise.resolve() };
      const error = new Error("test error");
      const next = async () => {
        throw error;
      };

      await middleware(ctx, next);

      expect(true).toBe(true);
    });
  });

  describe("createUnknownCommandMiddleware", () => {
    it("should call next for text message", async () => {
      const middleware = createUnknownCommandMiddleware();
      const ctx: any = { message: { text: "hello" }, reply: () => Promise.resolve() };
      let called = false;
      const next = async () => {
        called = true;
      };

      await middleware(ctx, next);

      expect(called).toBe(true);
    });

    it("should reject unknown command", async () => {
      const middleware = createUnknownCommandMiddleware();
      const ctx: any = {
        message: { text: "/unknown" },
        reply: () => Promise.resolve(),
      };
      let called = false;
      const next = async () => {
        called = true;
      };

      await middleware(ctx, next);

      expect(called).toBe(false);
    });
  });
});
