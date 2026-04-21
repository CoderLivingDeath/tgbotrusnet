import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../context/bot-context";

/**
 * Creates middleware that catches and handles errors in handlers.
 * Provides user-friendly error messages based on error type.
 * @returns Telegraf middleware function
 */
export function createErrorHandlerMiddleware(): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      
      ctx.logger.error({ error, errorMessage, stack, userId: ctx.from?.id }, "Unhandled error in handler");

      if (errorMessage.includes("ETELEGRAM") || errorMessage.includes("fetch")) {
        await ctx.reply("Ошибка сети. Попробуйте позже.");
      } else if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("database")) {
        await ctx.reply("Ошибка базы данных. Обратитесь к администратору.");
      } else {
        await ctx.reply(`Произошла ошибка. Попробуйте позже.\n\n${errorMessage.substring(0, 100)}`);
      }
    }
  };
}

/**
 * Creates middleware that handles unknown commands.
 * Replies with a help message for unrecognized commands.
 * @returns Telegraf middleware function
 */
export function createUnknownCommandMiddleware(): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await next();
      return;
    }

    const text =
      typeof ctx.message.text === "string" ? ctx.message.text : "";
    const command = text.split(" ")[0]?.trim();

    if (!command?.startsWith("/")) {
      await next();
      return;
    }

    const knownCommands = [
      "/start",
      "/menu",
      "/search",
      "/support",
      "/end",
      "/admin",
      "/operator",
    ];

    const isKnown = knownCommands.some((cmd) => command.startsWith(cmd));

    if (!isKnown) {
      await ctx.reply(
        "Неизвестная команда. Используйте /start для начала работы."
      );
      return;
    }

    await next();
  };
}