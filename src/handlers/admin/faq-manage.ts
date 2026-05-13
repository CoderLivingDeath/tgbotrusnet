import { Composer } from "telegraf";
import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import { createAdminAuthMiddleware } from "../../middleware/auth";
import { createFAQ, deleteFAQ } from "../../services/faq";

// Pending operations
const pendingOps = new Map<number, { action: string; step: number; data: Record<string, unknown> }>();

function setPending(userId: number, action: string): void {
  pendingOps.set(userId, { action, step: 0, data: {} });
}

function clearPending(userId: number): void {
  pendingOps.delete(userId);
}

const adminComposer = new Composer<BotContext>();

/**
 * /add_faq — multi-step: category_id → question → answer.
 */
adminComposer.command("add_faq", createAdminAuthMiddleware(), async (ctx) => {
  setPending(ctx.from!.id, "add_faq");
  await ctx.reply("Введите ID категории:");
});

/**
 * /delete_faq — asks for FAQ ID.
 */
adminComposer.command("delete_faq", createAdminAuthMiddleware(), async (ctx) => {
  setPending(ctx.from!.id, "delete_faq");
  await ctx.reply("Введите ID FAQ для удаления:");
});

/**
 * Text handler for follow-up inputs.
 */
export const adminFaqManageTextHandler: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.message || !("text" in ctx.message)) return next();
  if (ctx.message.text.startsWith("/")) return next();

  const userId = ctx.from?.id;
  if (!userId) return next();

  const pending = pendingOps.get(userId);
  if (!pending) return next();

  try {
    // /add_faq — step 0: category_id, step 1: question, step 2: answer
    if (pending.action === "add_faq") {
      if (pending.step === 0) {
        const categoryId = parseInt(ctx.message.text, 10);
        if (isNaN(categoryId) || categoryId <= 0) {
          await ctx.reply("Некорректный ID категории. Введите число:");
          return;
        }
        pending.data.categoryId = categoryId;
        pending.step = 1;
        await ctx.reply("Введите вопрос FAQ:");
        return;
      }
      if (pending.step === 1) {
        const question = ctx.message.text.trim();
        if (!question) {
          await ctx.reply("Вопрос не может быть пустым. Попробуйте ещё раз:");
          return;
        }
        pending.data.question = question;
        pending.step = 2;
        await ctx.reply("Введите ответ на FAQ:");
        return;
      }
      if (pending.step === 2) {
        const answer = ctx.message.text.trim();
        if (!answer) {
          await ctx.reply("Ответ не может быть пустым. Попробуйте ещё раз:");
          return;
        }
        const categoryId = pending.data.categoryId as number;
        const question = pending.data.question as string;
        const faq = await createFAQ(ctx.db, categoryId, question, answer);
        clearPending(userId);
        await ctx.reply(`✅ FAQ создан (ID: ${faq.id})`);
        return;
      }
    }

    // /delete_faq — FAQ ID
    if (pending.action === "delete_faq") {
      const id = parseInt(ctx.message.text, 10);
      if (isNaN(id) || id <= 0) {
        await ctx.reply("Некорректный ID. Введите число:");
        return;
      }
      const deleted = await deleteFAQ(ctx.db, id);
      clearPending(userId);
      if (deleted) {
        await ctx.reply("✅ FAQ удалён");
      } else {
        await ctx.reply("FAQ не найден");
      }
      return;
    }
  } catch (error) {
    ctx.logger.error({ error }, "Error in FAQ manage dialog");
    clearPending(userId);
    await ctx.reply("Произошла ошибка.");
    return;
  }
};

export default adminComposer;