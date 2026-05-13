import { Composer } from "telegraf";
import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import { createToken, validateToken } from "../../services/session";
import { loadConfig } from "../../config/index";
import { addOperator, removeOperator, listOperators } from "../../services/chat";

/**
 * Simple hash function for password hashing.
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "hash_" + Math.abs(hash).toString(36);
}

// ── Pending operations (dialogue state) ──────────────────────────────

interface PendingAction {
  action: string;
  step: number;
  data: Record<string, unknown>;
}

const pendingOps = new Map<number, PendingAction>();

function setPending(userId: number, action: string): void {
  pendingOps.set(userId, { action, step: 0, data: {} });
}

function clearPending(userId: number): void {
  pendingOps.delete(userId);
}

// ── Admin auth helper ────────────────────────────────────────────────

async function requireAdminAuth(ctx: BotContext): Promise<boolean> {
  const token = ctx.session?.token;
  if (!token) {
    await ctx.reply("Требуется авторизация. Используйте /admin_login");
    return false;
  }
  const session = validateToken(token);
  if (!session || session.type !== "admin") {
    await ctx.reply("Неверный токен сессии. Используйте /admin_login");
    return false;
  }
  ctx.session = { type: session.type, userId: session.user_id, token: session.token };
  return true;
}

// ── Composer ─────────────────────────────────────────────────────────

const adminComposer = new Composer<BotContext>();

// /admin_login — asks for password
adminComposer.command("admin_login", async (ctx) => {
  setPending(ctx.from!.id, "admin_login");
  await ctx.reply("Введите пароль администратора:");
});

// /admin_logout
adminComposer.command("admin_logout", async (ctx) => {
  if (!(await requireAdminAuth(ctx))) return;
  ctx.session = undefined;
  await ctx.reply("Вы вышли из системы");
});

// /admin_add_operator — asks for login then password
adminComposer.command("admin_add_operator", async (ctx) => {
  if (!(await requireAdminAuth(ctx))) return;
  setPending(ctx.from!.id, "admin_add_operator");
  await ctx.reply("Введите логин нового оператора (буквы и цифры):");
});

// /admin_remove_operator — asks for login
adminComposer.command("admin_remove_operator", async (ctx) => {
  if (!(await requireAdminAuth(ctx))) return;
  setPending(ctx.from!.id, "admin_remove_operator");
  await ctx.reply("Введите логин оператора для удаления:");
});

// /admin_list_operators — immediate
adminComposer.command("admin_list_operators", async (ctx) => {
  if (!(await requireAdminAuth(ctx))) return;
  try {
    const operators = await listOperators(ctx.db);
    if (operators.length === 0) {
      await ctx.reply("Нет операторов");
      return;
    }
    const list = operators.map((o) =>
      `• ${o.login} ${o.user_id ? `(ID: ${o.user_id})` : ""} ${o.is_active ? "🟢" : "🔴"}`
    ).join("\n");
    await ctx.reply(`Операторы:\n${list}`);
  } catch (error) {
    ctx.logger.error({ error }, "Failed to list operators");
    await ctx.reply("Ошибка при получении списка");
  }
});

// ── Text handler — catches follow-up messages for pending ops ────────

export const adminTextHandler: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.message || !("text" in ctx.message)) return next();
  const text = ctx.message.text;
  if (text.startsWith("/")) return next();

  const userId = ctx.from?.id;
  if (!userId) return next();

  const pending = pendingOps.get(userId);
  if (!pending) return next();

  try {
    // /admin_login — password
    if (pending.action === "admin_login") {
      const config = loadConfig();
      if (text !== config.adminPassword) {
        ctx.logger.warn({ userId }, "Failed admin login attempt");
        await ctx.reply("Неверный пароль. Попробуйте ещё раз:");
        return;
      }
      const token = createToken("admin", userId, config.sessionExpiryHours);
      ctx.session = { type: "admin", userId, token };
      clearPending(userId);
      ctx.logger.info({ userId }, "Admin logged in");
      await ctx.reply("Вы вошли как администратор");
      return;
    }

    // /admin_add_operator — step 1: login, step 2: password
    if (pending.action === "admin_add_operator") {
      if (pending.step === 0) {
        const login = text.trim();
        if (!/^[a-zA-Z0-9_]+$/.test(login)) {
          await ctx.reply("Логин должен содержать только буквы, цифры и подчёркивания. Попробуйте ещё раз:");
          return;
        }
        pending.data.login = login;
        pending.step = 1;
        await ctx.reply("Введите пароль для нового оператора:");
        return;
      }
      if (pending.step === 1) {
        const login = pending.data.login as string;
        const passwordHash = simpleHash(text);
        const result = await addOperator(ctx.db, login, passwordHash);
        clearPending(userId);
        if (result) {
          ctx.logger.info({ login }, "Operator added by admin");
          await ctx.reply(`Оператор "${login}" добавлен`);
        } else {
          await ctx.reply("Оператор с таким логином уже существует");
        }
        return;
      }
    }

    // /admin_remove_operator — login
    if (pending.action === "admin_remove_operator") {
      const login = text.trim();
      if (!/^[a-zA-Z0-9_]+$/.test(login)) {
        await ctx.reply("Некорректный логин. Введите логин оператора:");
        return;
      }
      const result = await removeOperator(ctx.db, login);
      clearPending(userId);
      if (result) {
        await ctx.reply(`Оператор "${login}" удалён`);
      } else {
        await ctx.reply("Оператор не найден");
      }
      return;
    }
  } catch (error) {
    ctx.logger.error({ error, userId }, "Error handling pending admin op");
    clearPending(userId);
    await ctx.reply("Произошла ошибка. Попробуйте снова.");
    return;
  }

  return next();
};

export default adminComposer;