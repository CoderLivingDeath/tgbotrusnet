import { Composer } from "telegraf";
import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import { createToken } from "../../services/session";
import { setOperatorStatus, findOperatorByLogin } from "../../services/chat";

/**
 * Simple hash function for password hashing.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "hash_" + Math.abs(hash).toString(36);
}

// ── Pending operations ───────────────────────────────────────────────

const pendingOps = new Map<number, { action: string; step: number; data: Record<string, unknown> }>();

function setPending(userId: number, action: string): void {
  pendingOps.set(userId, { action, step: 0, data: {} });
}

function clearPending(userId: number): void {
  pendingOps.delete(userId);
}

// ── Composer ─────────────────────────────────────────────────────────

const operatorComposer = new Composer<BotContext>();

// /operator_login — asks for login then password
operatorComposer.command("operator_login", async (ctx) => {
  setPending(ctx.from!.id, "operator_login");
  await ctx.reply("Введите логин оператора:");
});

// /operator_logout
operatorComposer.command("operator_logout", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация. Используйте /operator_login");
    return;
  }
  const operator = await findOperatorByLogin(ctx.db, ctx.session.login as string);
  if (operator) {
    await setOperatorStatus(ctx.db, operator.id, false);
  }
  ctx.session = undefined;
  await ctx.reply("Вы вышли из системы");
});

// /operator_available
operatorComposer.command("operator_available", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация");
    return;
  }
  const operator = await findOperatorByLogin(ctx.db, ctx.session.login as string);
  if (operator) {
    await setOperatorStatus(ctx.db, operator.id, true);
    await ctx.reply("Статус: доступен");
  }
});

// /operator_busy
operatorComposer.command("operator_busy", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация");
    return;
  }
  const operator = await findOperatorByLogin(ctx.db, ctx.session.login as string);
  if (operator) {
    await setOperatorStatus(ctx.db, operator.id, false);
    await ctx.reply("Статус: занят");
  }
});

// ── Text handler — catches follow-up messages for pending ops ────────

export const operatorTextHandler: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.message || !("text" in ctx.message)) return next();
  const text = ctx.message.text;
  if (text.startsWith("/")) return next();

  const userId = ctx.from?.id;
  if (!userId) return next();

  const pending = pendingOps.get(userId);
  if (!pending) return next();

  try {
    // /operator_login — step 1: login, step 2: password
    if (pending.action === "operator_login") {
      if (pending.step === 0) {
        const login = text.trim();
        const operator = await findOperatorByLogin(ctx.db, login);
        if (!operator) {
          await ctx.reply("Оператор с таким логином не найден. Попробуйте ещё раз:");
          return;
        }
        pending.data.login = login;
        pending.step = 1;
        await ctx.reply("Введите пароль:");
        return;
      }
      if (pending.step === 1) {
        const login = pending.data.login as string;
        const operator = await findOperatorByLogin(ctx.db, login);
        if (!operator) {
          await ctx.reply("Ошибка: оператор не найден. Начните заново: /operator_login");
          clearPending(userId);
          return;
        }

        const passwordHash = simpleHash(text);
        if (operator.password_hash !== passwordHash) {
          ctx.logger.warn({ userId }, "Failed operator login attempt");
          await ctx.reply("Неверный пароль. Попробуйте ещё раз:");
          return;
        }

        // Record telegram user_id for this operator session
        await ctx.db.query(
          "UPDATE operators SET user_id = $1 WHERE id = $2",
          [userId, operator.id]
        );

        const token = createToken("operator", userId, 24);
        await setOperatorStatus(ctx.db, operator.id, true);
        ctx.session = { type: "operator", userId, token, login };
        clearPending(userId);
        ctx.logger.info({ userId, login }, "Operator logged in");
        await ctx.reply(`Вы вошли как оператор "${login}"`);
        return;
      }
    }
  } catch (error) {
    ctx.logger.error({ error, userId }, "Error handling pending operator op");
    clearPending(userId);
    await ctx.reply("Произошла ошибка. Попробуйте снова.");
    return;
  }

  return next();
};

export default operatorComposer;