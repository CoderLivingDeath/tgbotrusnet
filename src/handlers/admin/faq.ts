import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context.js";
import { createAdminAuthMiddleware } from "../../middleware/auth.js";
import { createCategory, deleteCategory } from "../../services/faq.js";

const adminComposer = new Composer<BotContext>();

adminComposer.use(createAdminAuthMiddleware());

adminComposer.command("create-category", async (ctx) => {
  const args = ctx.message.text.split("|").slice(1);
  const name = args[0]?.trim();

  if (!name) {
    await ctx.reply(
      "Использование: /admin create-category | <название категории>"
    );
    return;
  }

  try {
    const category = await createCategory(ctx.db, name);
    await ctx.reply(`Категория создана: ${category.name} (ID: ${category.id})`);
  } catch (error) {
    ctx.logger.error({ error }, "Failed to create category");
    await ctx.reply("Ошибка при создании категории");
  }
});

adminComposer.command("delete-category", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  const id = parseInt(args[0], 10);

  if (isNaN(id)) {
    await ctx.reply("Использование: /admin delete-category <ID категории>");
    return;
  }

  try {
    const deleted = await deleteCategory(ctx.db, id);

    if (deleted) {
      await ctx.reply("Категория удалена");
    } else {
      await ctx.reply("Категория не найдена");
    }
  } catch (error) {
    ctx.logger.error({ error }, "Failed to delete category");
    await ctx.reply("Ошибка при удалении категории");
  }
});

export default adminComposer;