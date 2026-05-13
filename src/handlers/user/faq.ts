import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import { getCategories, getQuestionsByCategory, getFAQById } from "../../services/faq";
import { logRequest } from "../../services/request-log";
import { logUserAction } from "../../services/logger";
import { CB } from "../../constants/callbacks";

/**
 * User FAQ handler composer.
 * Handles /start, /menu commands and FAQ navigation via inline keyboards.
 */
const userComposer = new Composer<BotContext>();

/**
 * /start command - Shows welcome message and category menu.
 */
userComposer.command("start", async (ctx) => {
  try {
    const userId = ctx.from!.id;
    logUserAction("command_start", userId);
    const categories = await getCategories(ctx.db);

    const keyboard = categories.map((cat) => [
      {
        text: cat.name,
        callback_data: `${CB.CAT}${cat.id}`,
      },
    ]);
    keyboard.push([{ text: "📞 Создать заявку", callback_data: "enter_callback" }]);

    await ctx.reply(
      "👋 Добро пожаловать в службу поддержки!\n\nВыберите тему для получения ответа или создайте заявку:",
      {
        reply_markup: { inline_keyboard: keyboard },
      }
    );
  } catch (error) {
    ctx.logger.error({ error }, "Error in /start command");
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
});

/**
 * /menu command - Shows category menu.
 */
userComposer.command("menu", async (ctx) => {
  try {
    const categories = await getCategories(ctx.db);

    const keyboard = categories.map((cat) => [
      {
        text: cat.name,
        callback_data: `${CB.CAT}${cat.id}`,
      },
    ]);

    await ctx.reply("📋 Меню:", {
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (error) {
    ctx.logger.error({ error }, "Error in /menu command");
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
});

/**
 * Callback query handler - Processes inline keyboard selections.
 * Handles category navigation, FAQ viewing, and menu display.
 */
userComposer.on("callback_query", async (ctx) => {
  try {
    const query = ctx.callbackQuery;
    const userId = ctx.from!.id;

    if (!("data" in query) || !query.data) {
      return;
    }

    const data = query.data as string;

    if (data.startsWith(CB.CAT)) {
      const categoryId = parseInt(data.substring(CB.CAT.length), 10);

      await ctx.answerCbQuery();

      const categories = await getCategories(ctx.db);
      const category = categories.find((c) => c.id === categoryId);

      if (!category) {
        logUserAction("category_not_found", userId, { categoryId });
        await ctx.reply("Категория не найдена");
        return;
      }

      const questions = await getQuestionsByCategory(ctx.db, categoryId);

      await logRequest(ctx.db, userId, `category:${categoryId}`, category.name, ctx.logger);

      if (questions.length === 0) {
        logUserAction("category_empty", userId, { categoryId, categoryName: category.name });
        await ctx.reply(`📁 ${category.name}\n\nВ этой категории пока нет вопросов.`);
        return;
      }

      logUserAction("category_view", userId, { categoryId, categoryName: category.name, questionsCount: questions.length });

      const keyboard = questions.map((q) => [
        {
          text: q.question.substring(0, 60),
          callback_data: `${CB.FAQ}${q.id}`,
        },
      ]);

      await ctx.reply(`📁 ${category.name}\n\nВыберите вопрос:`, {
        reply_markup: { inline_keyboard: keyboard },
      });

      return;
    }

    if (data.startsWith(CB.FAQ)) {
      const faqId = parseInt(data.substring(CB.FAQ.length), 10);

      await ctx.answerCbQuery();

      const faq = await getFAQById(ctx.db, faqId);

      if (!faq) {
        logUserAction("faq_not_found", userId, { faqId });
        await ctx.reply("Вопрос не найден");
        return;
      }

      logUserAction("faq_view", userId, { faqId, question: faq.question.substring(0, 50) });

      await ctx.reply(
        `❓ ${faq.question}\n\n━━━━━━━━━━━━━━━━\n\n${faq.answer}`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 К меню", callback_data: CB.MENU }],
            ],
          },
        }
      );
      return;
    }

    if (data === "menu") {
      await ctx.answerCbQuery();

      const categories = await getCategories(ctx.db);

      const keyboard = categories.map((cat) => [
        {
          text: cat.name,
          callback_data: `${CB.CAT}${cat.id}`,
        },
      ]);

      await ctx.reply("📋 Меню:", {
        reply_markup: { inline_keyboard: keyboard },
      });
      return;
    }

    await ctx.answerCbQuery("Неизвестная команда");
  } catch (error) {
    ctx.logger.error({ error }, "Error in callback_query handler");
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
});

export default userComposer;