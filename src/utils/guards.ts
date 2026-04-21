import type { BotContext } from '../context/bot-context';

export function hasCallbackData(ctx: BotContext): ctx is BotContext & { callbackQuery: { data: string } } {
  const query = ctx.callbackQuery;
  return query !== undefined && 'data' in query && typeof query.data === 'string';
}

export function hasTextMessage(ctx: BotContext): ctx is BotContext & { message: { text: string } } {
  return 'message' in ctx && ctx.message !== undefined && 'text' in ctx.message && typeof ctx.message.text === 'string';
}

export function getUserId(ctx: BotContext): number | undefined {
  return ctx.from?.id;
}

export function getUserIdOrThrow(ctx: BotContext): number {
  const userId = ctx.from?.id;
  if (!userId) {
    throw new Error('No user ID in context');
  }
  return userId;
}

export function getChatIdFromCallback(data: string, prefix: string): number | null {
  const idStr = data.replace(prefix, '');
  const id = parseInt(idStr, 10);
  return isNaN(id) ? null : id;
}