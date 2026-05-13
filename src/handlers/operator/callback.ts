import { Composer } from "telegraf";
import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../../context/bot-context";
import {
  getPendingCallbackRequests,
  assignCallbackRequest,
  completeCallbackRequest,
  cancelCallbackRequest,
  getCallbackRequestById,
} from "../../services/callback";
import { findOperatorByLogin } from "../../services/chat";
import {
  startChat,
  endChat,
  isInActiveChat,
  getChatPartner,
  getChatSession,
  pauseChat,
  resumeChat,
  saveComment,
} from "../../services/chat-session";

// ── Pending operations ───────────────────────────────────────────────

const pendingOps = new Map<number, { action: string; step: number; data: Record<string, unknown> }>();

function setPending(userId: number, action: string): void {
  pendingOps.set(userId, { action, step: 0, data: {} });
}

function clearPending(userId: number): void {
  pendingOps.delete(userId);
}

// ── Composer ─────────────────────────────────────────────────────────

const operatorCallbackComposer = new Composer<BotContext>();

// ── Request management ───────────────────────────────────────────────

operatorCallbackComposer.command("requests", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация. Используйте /operator_login");
    return;
  }
  try {
    const requests = await getPendingCallbackRequests(ctx.db);
    if (requests.length === 0) {
      await ctx.reply("Нет ожидающих заявок.");
      return;
    }
    const lines = requests.map(
      (r) => `#${r.id} | User: ${r.user_id} | ${r.message.substring(0, 100)} | ${r.created_at}`
    );
    await ctx.reply(`📞 Ожидающие заявки (${requests.length}):\n\n${lines.join("\n")}`);
  } catch (error) {
    ctx.logger.error({ error }, "Failed to list callback requests");
    await ctx.reply("Ошибка при получении списка заявок.");
  }
});

operatorCallbackComposer.command("take", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация. Используйте /operator_login");
    return;
  }
  setPending(ctx.from!.id, "take");
  await ctx.reply("Введите ID заявки:");
});

operatorCallbackComposer.command("cancel_request", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация. Используйте /operator_login");
    return;
  }
  setPending(ctx.from!.id, "cancel_request");
  await ctx.reply("Введите ID заявки:");
});

// ── Chat-mode commands (operator must be in active chat) ─────────────

/**
 * /done — завершить чат, отметить заявку выполненной
 */
operatorCallbackComposer.command("done", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация.");
    return;
  }
  const session = getChatSession(ctx.from!.id);
  if (!session) {
    await ctx.reply("Нет активного чата. Используйте /take чтобы взять заявку.");
    return;
  }
  try {
    await completeCallbackRequest(ctx.db, session.requestId);
    await ctx.reply(`✅ Заявка #${session.requestId} выполнена. Чат завершён.`);
    await ctx.telegram.sendMessage(
      session.userTelegramId,
      `✅ Ваша заявка #${session.requestId} выполнена. Спасибо за обращение!`
    );
    endChat(ctx.from!.id);
  } catch (error) {
    ctx.logger.error({ error, requestId: session.requestId }, "Failed to complete");
    await ctx.reply("Ошибка при завершении заявки.");
  }
});

/**
 * /pause — поставить чат на паузу
 */
operatorCallbackComposer.command("pause", async (ctx) => {
  if (ctx.session?.type !== "operator") return;
  if (pauseChat(ctx.from!.id)) {
    await ctx.reply("⏸ Чат поставлен на паузу.");
  } else {
    await ctx.reply("Нет активного чата.");
  }
});

/**
 * /resume — возобновить чат
 */
operatorCallbackComposer.command("resume", async (ctx) => {
  if (ctx.session?.type !== "operator") return;
  if (resumeChat(ctx.from!.id)) {
    await ctx.reply("▶️ Чат возобновлён.");
  } else {
    await ctx.reply("Нет активного чата.");
  }
});

/**
 * /unassign — вернуть заявку в пул, завершить чат
 */
operatorCallbackComposer.command("unassign", async (ctx) => {
  if (ctx.session?.type !== "operator") return;
  const session = getChatSession(ctx.from!.id);
  if (!session) {
    await ctx.reply("Нет активного чата.");
    return;
  }
  try {
    await cancelCallbackRequest(ctx.db, session.requestId);
    await ctx.telegram.sendMessage(
      session.userTelegramId,
      `🔄 Ваша заявка #${session.requestId} возвращена в обработку. Ожидайте другого оператора.`
    );
    await ctx.reply(`🔄 Заявка #${session.requestId} возвращена в пул.`);
    endChat(ctx.from!.id);
  } catch (error) {
    ctx.logger.error({ error, requestId: session.requestId }, "Failed to unassign");
    await ctx.reply("Ошибка.");
  }
});

/**
 * /comment — asks for comment text (dialog)
 */
operatorCallbackComposer.command("comment", async (ctx) => {
  if (ctx.session?.type !== "operator") return;
  const session = getChatSession(ctx.from!.id);
  if (!session) {
    await ctx.reply("Нет активного чата.");
    return;
  }
  setPending(ctx.from!.id, "comment");
  pendingOps.get(ctx.from!.id)!.data.requestId = session.requestId;
  await ctx.reply("Введите комментарий к заявке:");
});

// ── Text handler — catches follow-up request IDs ────────────────────

export const callbackTextHandler: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.message || !("text" in ctx.message)) return next();
  const text = ctx.message.text;
  if (text.startsWith("/")) return next();

  const userId = ctx.from?.id;
  if (!userId) return next();

  // ── Handle pending request-ID input (take / cancel_request) ──
  if (ctx.session?.type === "operator") {
    const pending = pendingOps.get(userId);
    if (pending) {
      // /comment — text, not a number
      if (pending.action === "comment") {
        const commentText = text.trim();
        if (!commentText) {
          await ctx.reply("Комментарий не может быть пустым. Введите текст:");
          return;
        }
        const requestId = pending.data.requestId as number;
        try {
          await saveComment(ctx.db, requestId, commentText);
          clearPending(userId);
          await ctx.reply(`💬 Комментарий к заявке #${requestId} сохранён.`);
        } catch (error) {
          ctx.logger.error({ error, requestId }, "Failed to save comment");
          clearPending(userId);
          await ctx.reply("Ошибка при сохранении комментария.");
        }
        return;
      }

      const requestId = parseInt(text, 10);
      if (isNaN(requestId) || requestId <= 0) {
        await ctx.reply("Некорректный ID. Введите число:");
        return;
      }
      try {
        const op = await findOperatorByLogin(ctx.db, ctx.session.login as string);
        if (!op) {
          await ctx.reply("Ошибка: оператор не найден.");
          clearPending(userId);
          return;
        }
        if (pending.action === "take") {
          const req = await getCallbackRequestById(ctx.db, requestId);
          if (!req || req.status !== "pending") {
            await ctx.reply("Заявка не найдена или уже взята.");
            clearPending(userId);
            return;
          }
          const assigned = await assignCallbackRequest(ctx.db, requestId, op.id);
          clearPending(userId);
          if (assigned) {
            startChat(requestId, op.id, userId, req.user_id);
            await ctx.reply(
              `✅ Заявка #${requestId} взята.\n` +
              `Вы в чате с пользователем. Отправляйте сообщения — они уйдут ему.\n` +
              `Команды: /done /pause /resume /unassign /comment`
            );
            await ctx.telegram.sendMessage(
              req.user_id,
              `🔔 Оператор принял вашу заявку #${requestId}. Теперь вы можете общаться с ним прямо здесь.`
            );
          } else {
            await ctx.reply("Заявка уже взята другим оператором.");
          }
          return;
        }
        if (pending.action === "cancel_request") {
          const cancelled = await cancelCallbackRequest(ctx.db, requestId);
          clearPending(userId);
          if (cancelled) {
            await ctx.reply(`✅ Заявка #${requestId} отменена.`);
          } else {
            await ctx.reply("Заявка не найдена или уже завершена.");
          }
          return;
        }
      } catch (error) {
        ctx.logger.error({ error, requestId }, "Failed to process");
        clearPending(userId);
        await ctx.reply("Ошибка при обработке.");
        return;
      }
      return;
    }
  }

  // ── Forward messages between operator and user ──
  if (isInActiveChat(userId)) {
    const partner = getChatPartner(userId);
    if (partner) {
      const session = getChatSession(userId);
      try {
        const prefix = userId === session?.operatorTelegramId ? "💼 Оператор" : "👤 Пользователь";
        await ctx.telegram.sendMessage(partner, `${prefix}: ${text}`);
      } catch (error) {
        ctx.logger.error({ error, userId }, "Failed to forward message");
        await ctx.reply("Ошибка при отправке сообщения.");
      }
    }
    return;
  }

  return next();
};

export default operatorCallbackComposer;
