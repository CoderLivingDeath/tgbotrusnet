import { Context, MiddlewareFn } from "telegraf";
import type { Logger } from "../services/logger.js";
import type { DatabasePool } from "../services/database.js";

export interface BotContext extends Context {
  logger: Logger;
  db: DatabasePool;
  session?: {
    type: "admin" | "operator";
    userId: number;
    token: string;
  };
  activeChat?: {
    chatId: number;
    operatorId: number | null;
    status: "waiting" | "active" | "closed";
  };
}

export function createContextMiddleware(
  logger: Logger,
  db: DatabasePool
): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    (ctx as BotContext).logger = logger;
    (ctx as BotContext).db = db;
    await next();
  };
}