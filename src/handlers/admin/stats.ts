import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import { createAdminAuthMiddleware } from "../../middleware/auth";
import { getStatistics } from "../../services/request-log";

/**
 * Admin stats handler composer.
 * Handles /stats command with extended statistics (admin only).
 */
const adminComposer = new Composer<BotContext>();

/**
 * /stats command - Shows detailed request statistics.
 */
adminComposer.command("stats", createAdminAuthMiddleware(), async (ctx) => {
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
      `Среднее время ответа: ${Math.round(stats.average_response_time_ms)} мс`,
    ].join("\n");

    await ctx.reply(message);
  } catch (error) {
    ctx.logger.error({ error }, "Failed to get statistics");
    await ctx.reply("Ошибка при получении статистики");
  }
});

export default adminComposer;