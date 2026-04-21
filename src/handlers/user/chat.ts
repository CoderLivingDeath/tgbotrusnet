import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context.js";
import { startChat, sendMessage, endChat, isUserBanned, getAvailableOperators, assignOperatorToChat } from "../../services/chat.js";
import { logRequest } from "../../services/request-log.js";
import { logUserAction } from "../../services/logger.js";

const userComposer = new Composer<BotContext>();

userComposer.command("support", async (ctx) => {
  const userId = ctx.from!.id;
  logUserAction("command_support", userId);

  const banned = await isUserBanned(ctx.db, userId);

  if (banned) {
    await ctx.reply("Вы заблокированы. Обратитесь к администратору.");
    return;
  }

  const operators = await getAvailableOperators(ctx.db);

  if (operators.length === 0) {
    await ctx.reply("Нет доступных операторов. Попробуйте позже.");
    return;
  }

  try {
    const chat = await startChat(ctx.db, userId, null);

    const assigned = await assignOperatorToChat(ctx.db, chat.id, operators[0].id);

    await sendMessage(
      ctx.db,
      chat.id,
      "system",
      "Пользователь начал чат поддержки"
    );

    ctx.activeChat = {
      chatId: chat.id,
      operatorId: operators[0].id,
      status: assigned ? "active" : "waiting",
    };

    await logRequest(ctx.db, userId, "/support", "escalation", ctx.logger);
    logUserAction("escalation", userId, { chatId: chat.id, operatorId: operators[0].id });

    if (assigned) {
      await ctx.reply("✅ Оператор подключен. Задайте ваш вопрос:");
    } else {
      await ctx.reply("⏳ Ожидайте ответа оператора...");
    }
  } catch (error) {
    ctx.logger.error({ error, userId }, "Failed to start support chat");
    await ctx.reply("Ошибка при запуске чата. Попробуйте позже.");
  }
});

userComposer.command("end", async (ctx) => {
  if (!ctx.activeChat?.chatId) {
    await ctx.reply("Нет активного чата. Используйте /support для начала чата.");
    return;
  }

  try {
    const chat = await endChat(ctx.db, ctx.activeChat.chatId);

    if (chat) {
      await sendMessage(ctx.db, ctx.activeChat.chatId, "system", "Чат завершён пользователем");
      ctx.activeChat = undefined;
      await ctx.reply("Чат завершён. Спасибо за обращение!");
    } else {
      await ctx.reply("Чат не найден");
    }
  } catch (error) {
    ctx.logger.error({ error }, "Failed to end chat");
    await ctx.reply("Ошибка при завершении чата");
  }
});

userComposer.on("message", async (ctx) => {
  if (!ctx.activeChat?.chatId || !("text" in ctx.message)) {
    return;
  }

  const text =
    typeof ctx.message.text === "string" ? ctx.message.text : "";

  if (!text || text.startsWith("/")) {
    return;
  }

  try {
    await sendMessage(ctx.db, ctx.activeChat.chatId, "user", text);
    await ctx.reply("✅ Сообщение отправлено");
  } catch (error) {
    ctx.logger.error({ error }, "Failed to send message");
    await ctx.reply("Ошибка при отправке сообщения");
  }
});

export default userComposer;