import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context.js";
import { searchFAQs } from "../../services/faq.js";
import { logRequest } from "../../services/request-log.js";

const userComposer = new Composer<BotContext>();

userComposer.command("search", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  const keyword = args.join(" ").trim();

  if (!keyword) {
    await ctx.reply("Использование: /search <ключевое слово>");
    return;
  }

  const results = await searchFAQs(ctx.db, keyword);

  if (results.length === 0) {
    await ctx.reply(
      "По вашему запросу ничего не найдено. Используйте /support для связи с оператором."
    );
    return;
  }

  await logRequest(
    ctx.db,
    ctx.from!.id,
    keyword,
    "search",
    ctx.logger
  );

  const keyboard = results.slice(0, 10).map((faq) => [
    {
      text: faq.question.substring(0, 50),
      callback_data: `faq_${faq.id}`,
    },
  ]);

  await ctx.reply(
    `Найдено ${results.length} результатов:\nВыберите вопрос для просмотра ответа:`,
    {
      reply_markup: { inline_keyboard: keyboard },
    }
  );
});

export default userComposer;