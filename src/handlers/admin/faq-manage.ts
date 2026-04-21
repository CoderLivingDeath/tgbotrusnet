import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context.js";
import { createAdminAuthMiddleware } from "../../middleware/auth.js";
import { createFAQ, deleteFAQ } from "../../services/faq.js";

const adminComposer = new Composer<BotContext>();

adminComposer.use(createAdminAuthMiddleware());

adminComposer.command("add-faq", async (ctx) => {
  const parts = ctx.message.text.split("|");
  const categoryId = parseInt(parts[1]?.trim(), 10);
  const question = parts[2]?.trim();
  const answer = parts[3]?.trim();

  if (isNaN(categoryId) || !question || !answer) {
    await ctx.reply(
      "Использование: /admin add-faq |<категория_id>|<вопрос>|<ответ>"
    );
    return;
  }

  try {
    const faq = await createFAQ(ctx.db, categoryId, question, answer);
    await ctx.reply(`FAQ создан (ID: ${faq.id})`);
  } catch (error) {
    ctx.logger.error({ error }, "Failed to create FAQ");
    await ctx.reply("Ошибка при создании FAQ");
  }
});

adminComposer.command("delete-faq", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  const id = parseInt(args[0], 10);

  if (isNaN(id)) {
    await ctx.reply("Использование: /admin delete-faq <ID FAQ>");
    return;
  }

  try {
    const deleted = await deleteFAQ(ctx.db, id);

    if (deleted) {
      await ctx.reply("FAQ удалён");
    } else {
      await ctx.reply("FAQ не найден");
    }
  } catch (error) {
    ctx.logger.error({ error }, "Failed to delete FAQ");
    await ctx.reply("Ошибка при удалении FAQ");
  }
});

export default adminComposer;