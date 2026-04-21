import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../context/bot-context.js";

export function createErrorHandlerMiddleware(): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      ctx.logger.error({ error }, "Unhandled error in handler");

      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("ETELEGRAM") || errorMessage.includes("fetch")) {
        await ctx.reply("Ошибка сети. Попробуйте позже.");
      } else if (errorMessage.includes("ECONNREFUSED")) {
        await ctx.reply("Ошибка базы данных. Обратитесь к администратору.");
      } else {
        await ctx.reply("Произошла ошибка. Попробуйте позже.");
      }
    }
  };
}

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