/* eslint-disable @typescript-eslint/no-explicit-any */
import { Scenes } from 'telegraf';
import { Stage, WizardScene } from 'telegraf/scenes';
import type { MiddlewareFn } from 'telegraf';
import type { BotContext } from '../context/bot-context';
import { FaqService, ChatService } from '../di/container';
import { CB } from '../constants/callbacks';

const faqService = new FaqService();
const chatService = new ChatService();

const categoryScene = new WizardScene(
  'category',
  async (ctx) => {
    try {
      const context = ctx as unknown as BotContext & {
        scene: { state: { categoryId?: number } };
        wizard: { next: () => Promise<void> };
      };
      const categories = await faqService.getCategories(context.db);

      const keyboard = categories.map((cat) => [
        { text: cat.name, callback_data: `${CB.SCENE_CAT}${cat.id}` },
      ]);

      await ctx.reply(
        'Выберите категорию:',
        { reply_markup: { inline_keyboard: keyboard } }
      );

      return context.wizard.next();
    } catch (error) {
      const context = ctx as unknown as BotContext;
      context.logger.error({ error }, 'Error in category scene step 1');
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply('Пожалуйста, выберите категорию из меню.');
        return;
      }

      const data = (ctx.callbackQuery as { data?: string }).data;
      if (!data?.startsWith(CB.SCENE_CAT)) {
        await ctx.reply('Пожалуйста, выберите категорию из меню.');
        return;
      }

      const categoryId = parseInt(data.replace(CB.SCENE_CAT, ''), 10);
      const context = ctx as unknown as BotContext & { scene: { state: { categoryId?: number } } };
      const questions = await faqService.getQuestionsByCategory(context.db, categoryId);

      context.scene.state.categoryId = categoryId;

      if (questions.length === 0) {
        await ctx.reply('В этой категории пока нет вопросов.');
        return ctx.scene.leave();
      }

      const keyboard = questions.map((q) => [
        { text: q.question.substring(0, 60), callback_data: `${CB.SCENE_FAQ}${q.id}` },
      ]);
      keyboard.push([{ text: '🔙 К меню', callback_data: CB.SCENE_MENU }]);

      await ctx.reply('Выберите вопрос:', { reply_markup: { inline_keyboard: keyboard } });
      return (ctx as unknown as { wizard: { next: () => Promise<void> } }).wizard.next();
    } catch (error) {
      const context = ctx as unknown as BotContext;
      context.logger.error({ error }, 'Error in category scene step 2');
      await ctx.reply('Произошла ошибка.');
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply('Пожалуйста, выберите вопрос.');
        return;
      }

      const data = (ctx.callbackQuery as { data?: string }).data;

      if (data === CB.SCENE_MENU) {
        return ctx.scene.enter('category');
      }

      if (!data?.startsWith(CB.SCENE_FAQ)) {
        await ctx.reply('Пожалуйста, выберите вопрос.');
        return;
      }

      const faqId = parseInt(data.replace(CB.SCENE_FAQ, ''), 10);
      const context = ctx as unknown as BotContext;
      const faq = await faqService.getFAQById(context.db, faqId);

      if (!faq) {
        await ctx.reply('Вопрос не найден.');
        return ctx.scene.leave();
      }

      await ctx.reply(
        `❓ ${faq.question}\n\n━━━━━━━━━━━━━━━━\n\n${faq.answer}`,
        { reply_markup: { inline_keyboard: [[{ text: '🔙 К меню', callback_data: CB.SCENE_MENU }]] } }
      );

      return (ctx as unknown as { wizard: { next: () => Promise<void> } }).wizard.next();
    } catch (error) {
      const context = ctx as unknown as BotContext;
      context.logger.error({ error }, 'Error in category scene step 3');
      await ctx.reply('Произошла ошибка.');
      return ctx.scene.leave();
    }
  }
);

categoryScene.leave(async (ctx) => {
  await ctx.reply('До свидания! Используйте /start для начала.');
});

const escalationScene = new WizardScene(
  'escalation',
  async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return ctx.scene.leave();

      const context = ctx as unknown as BotContext & { scene: { state: { chatId?: number } } };
      const banned = await chatService.isUserBanned(context.db, userId);
      if (banned) {
        await ctx.reply('Вы заблокированы.');
        return ctx.scene.leave();
      }

      const operators = await chatService.getAvailableOperators(context.db);
      if (operators.length === 0) {
        await ctx.reply('Нет доступных операторов. Попробуйте позже.');
        return ctx.scene.leave();
      }

      const chat = await chatService.startChat(context.db, userId, null);
      const assigned = await chatService.assignOperatorToChat(context.db, chat.id, operators[0].id);
      await chatService.sendMessage(context.db, chat.id, 'system', 'Пользователь начал чат поддержки');

      context.scene.state.chatId = chat.id;

      if (assigned) {
        await ctx.reply('✅ Оператор подключен. Задайте ваш вопрос:');
      } else {
        await ctx.reply('⏳ Ожидайте ответа оператора...');
      }

      return (ctx as unknown as { wizard: { next: () => Promise<void> } }).wizard.next();
    } catch (error) {
      const context = ctx as unknown as BotContext;
      context.logger.error({ error }, 'Error in escalation scene');
      await ctx.reply('Произошла ошибка.');
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) return;
      const text = (ctx.message as { text?: string }).text;
      if (!text || text.startsWith('/')) return;

      const context = ctx as unknown as BotContext & { scene: { state: { chatId?: number } } };
      const chatId = context.scene.state.chatId;
      if (!chatId) return ctx.scene.leave();

      await chatService.sendMessage(context.db, chatId, 'user', text);
      await ctx.reply('✅ Сообщение отправлено');
    } catch (error) {
      const context = ctx as unknown as BotContext;
      context.logger.error({ error }, 'Error sending message in escalation');
    }
  }
);

escalationScene.command('end', async (ctx) => {
  try {
    const context = ctx as unknown as BotContext & { scene: { state: { chatId?: number } } };
    const chatId = context.scene.state.chatId;
    if (chatId) {
      await chatService.sendMessage(context.db, chatId, 'system', 'Чат завершён пользователем');
      await chatService.endChat(context.db, chatId);
    }
    await ctx.reply('Чат завершён.');
  } catch (error) {
    const context = ctx as unknown as BotContext;
    context.logger.error({ error }, 'Error ending escalation');
  }
  return ctx.scene.leave();
});

const operatorChatScene = new WizardScene(
  'operator-chat',
  async (ctx) => {
    try {
      const context = ctx as unknown as BotContext;
      const chats = await chatService.getActiveChats(context.db);

      if (chats.length === 0) {
        await ctx.reply('Нет активных чатов.');
        return ctx.scene.leave();
      }

      const keyboard = chats.map((chat) => [
        { text: `Чат #${chat.id} (user: ${chat.user_id})`, callback_data: `${CB.OP_CHAT}${chat.id}` },
      ]);

      await ctx.reply('Выберите чат:', { reply_markup: { inline_keyboard: keyboard } });
      return (ctx as unknown as { wizard: { next: () => Promise<void> } }).wizard.next();
    } catch (error) {
      const context = ctx as unknown as BotContext;
      context.logger.error({ error }, 'Error in operator chat scene');
      await ctx.reply('Произошла ошибка.');
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply('Выберите чат.');
        return;
      }

      const data = (ctx.callbackQuery as { data?: string }).data;
      if (!data?.startsWith(CB.OP_CHAT)) {
        await ctx.reply('Выберите чат.');
        return;
      }

      const chatId = parseInt(data.replace(CB.OP_CHAT, ''), 10);
      const context = ctx as unknown as BotContext & { scene: { state: { chatId?: number } } };
      const messages = await chatService.getChatHistory(context.db, chatId);

      context.scene.state.chatId = chatId;

      const history = messages.map((m) => 
        `${m.sender_type === 'user' ? '👤' : '💼'}: ${m.text}`
      ).join('\n') || 'Нет сообщений';

      await ctx.reply(
        `История чата #${chatId}:\n\n${history}\n\nНапишите сообщение для ответа:`,
        { reply_markup: { inline_keyboard: [[{ text: '❌ Завершить чат', callback_data: 'op_close' }]] } }
      );

      return (ctx as unknown as { wizard: { next: () => Promise<void> } }).wizard.next();
    } catch (error) {
      const context = ctx as unknown as BotContext;
      context.logger.error({ error }, 'Error in operator chat scene step 2');
      await ctx.reply('Произошла ошибка.');
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) return;
      const text = (ctx.message as { text?: string }).text;
      if (!text || text.startsWith('/')) return;

      const context = ctx as unknown as BotContext & { scene: { state: { chatId?: number } } };
      const chatId = context.scene.state.chatId;
      if (!chatId) return ctx.scene.leave();

      await chatService.sendMessage(context.db, chatId, 'operator', text);
      await ctx.reply('✅ Сообщение отправлено');
    } catch (error) {
      const context = ctx as unknown as BotContext;
      context.logger.error({ error }, 'Error sending operator message');
    }
  }
);

operatorChatScene.action('op_close', async (ctx) => {
  try {
    const context = ctx as unknown as BotContext & { scene: { state: { chatId?: number } } };
    const chatId = context.scene.state.chatId;
    if (chatId) {
      await chatService.sendMessage(context.db, chatId, 'system', 'Чат завершён оператором');
      await chatService.endChat(context.db, chatId);
    }
    await ctx.reply('Чат завершён.');
  } catch (error) {
    const context = ctx as unknown as BotContext;
    context.logger.error({ error }, 'Error closing operator chat');
  }
  return ctx.scene.leave();
});

const stage = new Stage([
  categoryScene as any,
  escalationScene as any,
  operatorChatScene as any
]) as any;

const sceneMiddleware = stage.middleware() as unknown as MiddlewareFn<BotContext>;

export { stage, Scenes, sceneMiddleware };
export default stage;