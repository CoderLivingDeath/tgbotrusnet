import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context.js";
import { getCategories, getQuestionsByCategory, getFAQById } from "../../services/faq.js";
import { logRequest } from "../../services/request-log.js";

const userComposer = new Composer<BotContext>();

userComposer.command("start", async (ctx) => {
  const categories = await getCategories(ctx.db);

  const keyboard = categories.map((cat) => [
    {
      text: cat.name,
      callback_data: `cat_${cat.id}`,
    },
  ]);

  await ctx.reply(
    "👋 Добро пожаловать в службу поддержки!\n\nВыберите тему для получения ответа:",
    {
      reply_markup: { inline_keyboard: keyboard },
    }
  );
});

userComposer.command("menu", async (ctx) => {
  const categories = await getCategories(ctx.db);

  const keyboard = categories.map((cat) => [
    {
      text: cat.name,
      callback_data: `cat_${cat.id}`,
    },
  ]);

  await ctx.reply("📋 Меню:", {
    reply_markup: { inline_keyboard: keyboard },
  });
});

userComposer.on("callback_query", async (ctx) => {
  const query = ctx.callbackQuery;

  if (!("data" in query) || !query.data) {
    return;
  }

  const data = query.data as string;

  if (data.startsWith("cat_")) {
    const categoryId = parseInt(data.substring(4), 10);

    await ctx.answerCbQuery();

    const categories = await getCategories(ctx.db);
    const category = categories.find((c) => c.id === categoryId);

    if (!category) {
      await ctx.reply("Категория не найдена");
      return;
    }

    const questions = await getQuestionsByCategory(ctx.db, categoryId);

    await logRequest(ctx.db, ctx.from!.id, `category:${categoryId}`, category.name, ctx.logger);

    if (questions.length === 0) {
      await ctx.reply(`📁 ${category.name}\n\nВ этой категории пока нет вопросов.`);
      return;
    }

    const keyboard = questions.map((q) => [
      {
        text: q.question.substring(0, 60),
        callback_data: `faq_${q.id}`,
      },
    ]);

    await ctx.reply(`📁 ${category.name}\n\nВыберите вопрос:`, {
      reply_markup: { inline_keyboard: keyboard },
    });

    return;
  }

  if (data.startsWith("faq_")) {
    const faqId = parseInt(data.substring(4), 10);

    await ctx.answerCbQuery();

    const faq = await getFAQById(ctx.db, faqId);

    if (!faq) {
      await ctx.reply("Вопрос не найден");
      return;
    }

    await ctx.reply(
      `❓ ${faq.question}\n\n━━━━━━━━━━━━━━━━\n\n${faq.answer}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 К меню", callback_data: "menu" }],
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
        callback_data: `cat_${cat.id}`,
      },
    ]);

    await ctx.reply("📋 Меню:", {
      reply_markup: { inline_keyboard: keyboard },
    });
    return;
  }

  await ctx.answerCbQuery("Неизвестная команда");
});

export default userComposer;