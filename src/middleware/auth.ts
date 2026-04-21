import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../context/bot-context.js";
import { validateToken } from "../services/session.js";

export function createAdminAuthMiddleware(): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const token = ctx.session?.token;

    if (!token) {
      await ctx.reply("Требуется авторизация. Используйте /admin login <пароль>");
      return;
    }

    const session = validateToken(token);

    if (!session || session.type !== "admin") {
      await ctx.reply("Неверный токен сессии. Используйте /admin login <пароль>");
      return;
    }

    ctx.session = {
      type: session.type,
      userId: session.user_id,
      token: session.token,
    };

    await next();
  };
}

export function createOperatorAuthMiddleware(): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const token = ctx.session?.token;

    if (!token) {
      await ctx.reply("Требуется авторизация. Используйте /operator login <пароль>");
      return;
    }

    const session = validateToken(token);

    if (!session || session.type !== "operator") {
      await ctx.reply("Неверный токен сессии. Используйте /operator login <пароль>");
      return;
    }

    ctx.session = {
      type: session.type,
      userId: session.user_id,
      token: session.token,
    };

    await next();
  };
}