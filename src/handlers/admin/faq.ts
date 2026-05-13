import { Composer } from "telegraf";
import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import { createAdminAuthMiddleware } from "../../middleware/auth";
import { createCategory, deleteCategory } from "../../services/faq";

// Pending operations — step-by-step dialogs
const pendingOps = new Map<number, { action: string; step: number; data: Record<string, unknown> }>();

function setPending(userId: number, action: string): void {
  pendingOps.set(userId, { action, step: 0, data: {} });
}

function clearPending(userId: number): void {
  pendingOps.delete(userId);
}

const adminComposer = new Composer<BotContext>();

/**
 * /create_category — asks for category name.
 */
adminComposer.command("create_category", createAdminAuthMiddleware(), async (ctx) => {
  setPending(ctx.from!.id, "create_category");
  await ctx.reply("Введите название новой категории:");
});

/**
 * /delete_category — asks for category ID.
 */
adminComposer.command("delete_category", createAdminAuthMiddleware(), async (ctx) => {
  setPending(ctx.from!.id, "delete_category");
  await ctx.reply("Введите ID категории для удаления:");
});

/**
 * Text handler for follow-up inputs.
 */
export const adminFaqTextHandler: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.message || !("text" in ctx.message)) return next();
  if (ctx.message.text.startsWith("/")) return next();

  const userId = ctx.from?.id;
  if (!userId) return next();

  const pending = pendingOps.get(userId);
  if (!pending) return next();

  try {
    if (pending.action === "create_category") {
      const name = ctx.message.text.trim();
      if (!name) {
        await ctx.reply("Название не может быть пустым. Попробуйте ещё раз:");
        return;
      }
      const category = await createCategory(ctx.db, name);
      clearPending(userId);
      await ctx.reply(`✅ Категория создана: ${category.name} (ID: ${category.id})`);
      return;
    }

    if (pending.action === "delete_category") {
      const id = parseInt(ctx.message.text, 10);
      if (isNaN(id) || id <= 0) {
        await ctx.reply("Некорректный ID. Введите число:");
        return;
      }
      const deleted = await deleteCategory(ctx.db, id);
      clearPending(userId);
      if (deleted) {
        await ctx.reply("✅ Категория удалена");
      } else {
        await ctx.reply("Категория не найдена");
      }
      return;
    }
  } catch (error) {
    ctx.logger.error({ error }, "Error in FAQ admin dialog");
    clearPending(userId);
    await ctx.reply("Произошла ошибка.");
    return;
  }
};

export default adminComposer;