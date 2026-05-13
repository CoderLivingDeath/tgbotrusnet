/* eslint-disable @typescript-eslint/no-explicit-any */
import { Scenes } from 'telegraf';
import { Stage, WizardScene } from 'telegraf/scenes';
import type { MiddlewareFn } from 'telegraf';
import type { BotContext } from '../context/bot-context';
import { isUserBanned } from '../services/chat';
import { createCallbackRequest, cancelCallbackRequest, getUserCallbackRequests, notifyOperators } from '../services/callback';
import { logRequest, logResponse } from '../services/request-log';

const callbackScene = new WizardScene(
  'callback',
  async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return ctx.scene.leave();

      const context = ctx as unknown as BotContext;
      const banned = await isUserBanned(context.db, userId);
      if (banned) {
        await ctx.reply('Вы заблокированы. Обратитесь к администратору.');
        return ctx.scene.leave();
      }

      await ctx.reply(
        'Опишите вашу проблему. Оператор свяжется с вами позднее.\n\n' +
        'Отправьте описание или нажмите /cancel для отмены.'
      );

      return (ctx as unknown as { wizard: { next: () => Promise<void> } }).wizard.next();
    } catch (error) {
      const context = ctx as unknown as BotContext;
      context.logger.error({ error }, 'Error in callback scene step 1');
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) return;
      const text = (ctx.message as { text?: string }).text;
      if (!text || text.startsWith('/')) return;

      const userId = ctx.from?.id;
      if (!userId) return ctx.scene.leave();

      const context = ctx as unknown as BotContext;

      const request = await createCallbackRequest(context.db, userId, text);

      await logRequest(context.db, userId, text, '/support', context.logger);
      await logResponse(context.db, userId, 'callback_request', context.logger);

      await ctx.reply(
        `✅ Заявка на обратный звонок #${request.id} создана.\n` +
        'Оператор свяжется с вами. Вы можете отменить заявку командой /cancel.'
      );

      await notifyOperators(context.db, ctx.telegram, request);

      return ctx.scene.leave();
    } catch (error) {
      const context = ctx as unknown as BotContext;
      context.logger.error({ error }, 'Error in callback scene step 2');
      await ctx.reply('Произошла ошибка при создании заявки.');
      return ctx.scene.leave();
    }
  }
);

callbackScene.command('cancel', async (ctx) => {
  try {
    const context = ctx as unknown as BotContext;
    const userId = ctx.from?.id;
    if (!userId) return ctx.scene.leave();

    const userRequests = await getUserCallbackRequests(context.db, userId);
    const pending = userRequests.find((r) => r.status === 'pending' || r.status === 'in_progress');

    if (pending) {
      await cancelCallbackRequest(context.db, pending.id);
      await ctx.reply('✅ Заявка отменена.');
    } else {
      await ctx.reply('Нет активных заявок для отмены.');
    }
  } catch (error) {
    const context = ctx as unknown as BotContext;
    context.logger.error({ error }, 'Error cancelling callback request');
    await ctx.reply('Ошибка при отмене заявки.');
  }
  return ctx.scene.leave();
});

const stage = new Stage([
  callbackScene as any
]) as any;

const sceneMiddleware = stage.middleware() as unknown as MiddlewareFn<BotContext>;

export { stage, Scenes, sceneMiddleware };
export default stage;