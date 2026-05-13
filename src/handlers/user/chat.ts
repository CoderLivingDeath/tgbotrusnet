import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import { isUserBanned } from "../../services/chat";
import { logRequest } from "../../services/request-log";
import { logUserAction } from "../../services/logger";

/**
 * User chat handler composer.
 * Handles /support command — creates a callback request instead of live chat.
 */
const userComposer = new Composer<BotContext>();

/**
 * /support command handler.
 * Creates a callback request for operator assistance.
 */
export async function handleSupportCommand(ctx: BotContext): Promise<void> {
  const userId = ctx.from!.id;
  logUserAction("command_support", userId);

  const banned = await isUserBanned(ctx.db, userId);

  if (banned) {
    await ctx.reply("Вы заблокированы. Обратитесь к администратору.");
    return;
  }

  try {
    await logRequest(ctx.db, userId, "/support", "callback_request", ctx.logger);
    logUserAction("callback_request", userId);

    // Enter callback scene to collect problem description
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((ctx as any).scene) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (ctx as any).scene.enter("callback");
    }
  } catch (error) {
    ctx.logger.error({ error, userId }, "Failed to create callback request");
    await ctx.reply("Ошибка при создании заявки. Попробуйте позже.");
  }
}

export default userComposer;