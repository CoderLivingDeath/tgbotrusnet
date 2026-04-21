import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context.js";
import { createAdminAuthMiddleware } from "../../middleware/auth.js";
import { getStatistics } from "../../services/request-log.js";

const operatorComposer = new Composer<BotContext>();

operatorComposer.use(createAdminAuthMiddleware());

operatorComposer.command("stats", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const days = parseInt(args[1], 10) || 7;

  try {
    const stats = await getStatistics(ctx.db, days);

    const message = [
      `📊 Статистика за ${days} дней`,
      `─────────────────`,
      `Всего запросов: ${stats.total}`,
      `Автоответов: ${stats.auto_responses}`,
      `Эскалаций: ${stats.escalations}`,
    ].join("\n");

    await ctx.reply(message);
  } catch (error) {
    ctx.logger.error({ error }, "Failed to get statistics");
    await ctx.reply("Ошибка при получении статистики");
  }
});

export default operatorComposer;