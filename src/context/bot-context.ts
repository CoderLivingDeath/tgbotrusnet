import { Context, MiddlewareFn } from "telegraf";
import type { Logger } from "../services/logger.js";
import type { DatabasePool } from "../services/database.js";

export interface BotContext extends Context {
  logger: Logger;
  db: DatabasePool;
}

export function createContextMiddleware(
  logger: Logger,
  db: DatabasePool
): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const botCtx = ctx as BotContext;
    botCtx.logger = logger;
    botCtx.db = db;
    await next();
  };
}