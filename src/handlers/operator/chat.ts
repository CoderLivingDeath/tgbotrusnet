import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import {
  getActiveChatsForOperator,
  getChatHistory,
  sendMessage,
  endChat,
  banUser,
  getChatById,
} from "../../services/chat";
import { logUserAction } from "../../services/logger";
import { CB } from "../../constants/callbacks";

/**
 * Operator chat handler composer.
 * Handles /chats, /reply, /end, /ban commands for operators.
 */
const operatorComposer = new Composer<BotContext>();

/**
 * /chats command - Lists active chats for the operator.
 */
operatorComposer.command("chats", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация. Используйте /operator login");
    return;
  }

  const userId = ctx.session.userId;
  if (!userId) {
    await ctx.reply("Ошибка сессии");
    return;
  }

  const chats = await getActiveChatsForOperator(ctx.db, userId);

  if (chats.length === 0) {
    await ctx.reply("Нет активных чатов");
    return;
  }

  const keyboard = chats.map((chat) => [
    {
      text: `Чат #${chat.id} (${chat.status})`,
      callback_data: `${CB.CHAT}${chat.id}`,
    },
  ]);

  await ctx.reply("Активные чаты:", {
    reply_markup: { inline_keyboard: keyboard },
  });
});

/**
 * /reply command - Sends a reply to a user's chat.
 */
operatorComposer.command("reply", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация");
    return;
  }

  const args = ctx.message.text.split(" ");
  const chatId = parseInt(args[1], 10);
  const message = args.slice(2).join(" ");

  if (isNaN(chatId) || !message) {
    await ctx.reply("Использование: /reply <ID чата> <текст>");
    return;
  }

  try {
    const history = await getChatHistory(ctx.db, chatId);

    if (history.length === 0) {
      await ctx.reply("Чат не найден");
      return;
    }

    await sendMessage(ctx.db, chatId, "operator", message);

    const chatInfo = await getChatById(ctx.db, chatId);

    if (chatInfo && chatInfo.user_id) {
      await ctx.telegram.sendMessage(
        chatInfo.user_id,
        `📩 Ответ от оператора:\n\n${message}`
      );
    }

    await ctx.reply(`Сообщение отправлено в чат #${chatId}`);
  } catch (error) {
    ctx.logger.error({ error, chatId }, "Failed to send reply");
    await ctx.reply("Ошибка при отправке сообщения");
  }
});

/**
 * /end command - Ends a chat by ID.
 */
operatorComposer.command("end", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация");
    return;
  }

  const args = ctx.message.text.split(" ");
  const chatId = parseInt(args[1], 10);

  if (isNaN(chatId)) {
    await ctx.reply("Использование: /operator end <ID чата>");
    return;
  }

  try {
    const chat = await endChat(ctx.db, chatId);

    if (chat) {
      await sendMessage(ctx.db, chatId, "system", "Чат завершён оператором");
      await ctx.reply(`Чат #${chatId} завершён`);
    } else {
      await ctx.reply("Чат не найден");
    }
  } catch (error) {
    ctx.logger.error({ error, chatId }, "Failed to end chat");
    await ctx.reply("Ошибка при завершении чата");
  }
});

/**
 * /ban command - Bans a user from using the bot.
 */
operatorComposer.command("ban", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация");
    return;
  }

  const args = ctx.message.text.split(" ");
  const userId = parseInt(args[1], 10);
  const reason = args.slice(2).join(" ") || "Нарушение правил";

  if (isNaN(userId)) {
    await ctx.reply("Использование: /operator ban <user_id> [причина]");
    return;
  }

  try {
    const banned = await banUser(ctx.db, userId, reason);

    if (banned) {
      ctx.logger.info({ userId, reason }, "User banned by operator");
      logUserAction("ban_user", ctx.from!.id, { bannedUserId: userId, reason });
      await ctx.reply(`Пользователь ${userId} заблокирован`);
    } else {
      await ctx.reply("Ошибка при блокировке");
    }
  } catch (error) {
    ctx.logger.error({ error, userId }, "Failed to ban user");
    await ctx.reply("Ошибка при блокировке");
  }
});

export default operatorComposer;