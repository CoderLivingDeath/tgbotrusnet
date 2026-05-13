import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import { createOperatorAuthMiddleware } from "../../middleware/auth";
import { getStatistics } from "../../services/request-log";

/**
 * Operator stats handler composer.
 * Handles /stats command for viewing request statistics.
 */
const operatorComposer = new Composer<BotContext>();

/**
 * /stats command - Shows request statistics.
 */
operatorComposer.command("stats", createOperatorAuthMiddleware(), async (ctx) => {
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