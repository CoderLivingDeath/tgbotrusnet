import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../context/bot-context";
import { validateToken } from "../services/session";

/**
 * Creates middleware that validates admin authentication.
 * Checks for valid admin session token.
 * @returns Telegraf middleware function
 */
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

/**
 * Creates middleware that validates operator authentication.
 * Checks for valid operator session token.
 * @returns Telegraf middleware function
 */
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