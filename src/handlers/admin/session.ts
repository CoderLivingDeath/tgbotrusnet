import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import { createAdminAuthMiddleware } from "../../middleware/auth";
import { createToken } from "../../services/session";
import { loadConfig } from "../../config/index";
import { addOperator, removeOperator, listOperators } from "../../services/chat";

/**
 * Simple hash function for password hashing.
 * @param str - Input string to hash
 * @returns Hashed string with prefix
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

/**
 * Admin session handler composer.
 * Handles /admin login, /admin logout, /admin add-operator, /admin remove-operator, /admin list-operators commands.
 */
const adminComposer = new Composer<BotContext>();

/**
 * /admin login command - Authenticates an admin.
 */
adminComposer.command("admin login", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(2);
  const password = args[0];

  if (!password) {
    await ctx.reply("Использование: /admin login <пароль>");
    return;
  }

  const config = loadConfig();

  if (password !== config.adminPassword) {
    ctx.logger.warn({ userId: ctx.from?.id }, "Failed admin login attempt");
    await ctx.reply("Неверный пароль");
    return;
  }

  const token = createToken("admin", ctx.from!.id, config.sessionExpiryHours);

  ctx.session = {
    type: "admin",
    userId: ctx.from!.id,
    token,
  };

  ctx.logger.info({ userId: ctx.from?.id }, "Admin logged in");
  await ctx.reply("Вы вошли как администратор");
});

/**
 * /admin logout command - Logs out the admin.
 */
adminComposer.command("admin logout", createAdminAuthMiddleware(), async (ctx) => {
  if (ctx.session?.token) {
    ctx.session = undefined;
    await ctx.reply("Вы вышли из системы");
  }
});

/**
 * /admin add-operator command - Adds a new operator (admin only).
 */
adminComposer.command(
  "admin add-operator",
  createAdminAuthMiddleware(),
  async (ctx) => {
    const args = ctx.message.text.split(" ");
    const userId = parseInt(args[2], 10);
    const password = args[3];

    if (isNaN(userId) || !password) {
      await ctx.reply("Использование: /admin add-operator <telegram_id> <пароль>");
      return;
    }

    try {
      const passwordHash = simpleHash(password);

      const result = await addOperator(ctx.db, userId, passwordHash);

      if (result) {
        ctx.logger.info({ userId }, "Operator added by admin");
        await ctx.reply(`Оператор добавлен: ${userId}`);
      } else {
        await ctx.reply("Оператор уже существует");
      }
    } catch (error) {
      ctx.logger.error({ error, userId }, "Failed to add operator");
      await ctx.reply("Ошибка при добавлении оператора");
    }
  }
);

/**
 * /admin remove-operator command - Removes an operator (admin only).
 */
adminComposer.command(
  "admin remove-operator",
  createAdminAuthMiddleware(),
  async (ctx) => {
    const args = ctx.message.text.split(" ");
    const userId = parseInt(args[2], 10);

    if (isNaN(userId)) {
      await ctx.reply("Использование: /admin remove-operator <telegram_id>");
      return;
    }

    try {
      const result = await removeOperator(ctx.db, userId);

      if (result) {
        ctx.logger.info({ userId }, "Operator removed by admin");
        await ctx.reply(`Оператор удалён: ${userId}`);
      } else {
        await ctx.reply("Оператор не найден");
      }
    } catch (error) {
      ctx.logger.error({ error, userId }, "Failed to remove operator");
      await ctx.reply("Ошибка при удалении оператора");
    }
  }
);

adminComposer.command(
  "admin list-operators",
  createAdminAuthMiddleware(),
  async (ctx) => {
    try {
      const operators = await listOperators(ctx.db);

      if (operators.length === 0) {
        await ctx.reply("Нет операторов");
        return;
      }

      const list = operators
        .map(
          (o) =>
            `• ${o.user_id} ${o.is_active ? "🟢" : "🔴"}`
        )
        .join("\n");

      await ctx.reply(`Операторы:\n${list}`);
    } catch (error) {
      ctx.logger.error({ error }, "Failed to list operators");
      await ctx.reply("Ошибка при получении списка");
    }
  }
);

export default adminComposer;