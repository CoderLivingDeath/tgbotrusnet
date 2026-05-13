import { handleSupportCommand } from "../../../src/handlers/user/chat";
import type { BotContext } from "../../../src/context/bot-context";

// Mock service dependencies
const mockIsUserBanned = jest.fn();
const mockLogRequest = jest.fn();
const mockLogUserAction = jest.fn();

jest.mock("../../../src/services/chat", () => ({
  isUserBanned: (...args: unknown[]) => mockIsUserBanned(...args),
}));

jest.mock("../../../src/services/request-log", () => ({
  logRequest: (...args: unknown[]) => mockLogRequest(...args),
}));

jest.mock("../../../src/services/logger", () => ({
  logUserAction: (...args: unknown[]) => mockLogUserAction(...args),
}));

function createMockCtx(overrides: Partial<BotContext> = {}): BotContext {
  return {
    from: { id: 12345, is_bot: false, first_name: "Test" },
    db: {},
    logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn(), warn: jest.fn() },
    reply: jest.fn().mockResolvedValue({ message_id: 1 }),
    scene: { enter: jest.fn().mockResolvedValue(undefined) },
    ...overrides,
  } as unknown as BotContext;
}

describe("User Chat Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("/support command", () => {
    it("should log action, check ban, log request, and enter callback scene when user is not banned", async () => {
      mockIsUserBanned.mockResolvedValue(false);
      mockLogRequest.mockResolvedValue(undefined);

      const ctx = createMockCtx();
      await handleSupportCommand(ctx);

      expect(mockLogUserAction).toHaveBeenCalledWith("command_support", 12345);
      expect(mockIsUserBanned).toHaveBeenCalledWith(ctx.db, 12345);
      expect(mockLogRequest).toHaveBeenCalledWith(ctx.db, 12345, "/support", "callback_request", ctx.logger);
      expect(mockLogUserAction).toHaveBeenCalledWith("callback_request", 12345);
      expect((ctx as any).scene.enter).toHaveBeenCalledWith("callback");
    });

    it("should reply ban message and stop when user is banned", async () => {
      mockIsUserBanned.mockResolvedValue(true);

      const ctx = createMockCtx();
      await handleSupportCommand(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        "Вы заблокированы. Обратитесь к администратору."
      );
      expect(mockLogRequest).not.toHaveBeenCalled();
      expect((ctx as any).scene.enter).not.toHaveBeenCalled();
    });

    it("should reply error message when logRequest throws", async () => {
      mockIsUserBanned.mockResolvedValue(false);
      const dbError = new Error("DB error");
      mockLogRequest.mockRejectedValue(dbError);

      const ctx = createMockCtx();
      await handleSupportCommand(ctx);

      expect(ctx.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: dbError, userId: 12345 }),
        "Failed to create callback request"
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        "Ошибка при создании заявки. Попробуйте позже."
      );
    });
  });
});
