import 'dotenv/config';
import { Telegraf, session } from "telegraf";
import pino from "pino";
import { parseArgs, createProgram, type CLIArgs } from "./utils/cli.js";
import { createLogger } from "./services/logger.js";
import { createDatabasePool, closeDatabasePool, type DatabasePool } from "./services/database.js";
import { createContextMiddleware, type BotContext } from "./context/bot-context.js";
import { createErrorHandlerMiddleware, createUnknownCommandMiddleware } from "./middleware/error-handler.js";
import { initializeSchema } from "./services/schema.js";
import adminSession, { adminTextHandler } from "./handlers/admin/session.js";
import adminFAQ, { adminFaqTextHandler } from "./handlers/admin/faq.js";
import adminFAQManage, { adminFaqManageTextHandler } from "./handlers/admin/faq-manage.js";
import adminStats from "./handlers/admin/stats.js";
import operatorSession, { operatorTextHandler } from "./handlers/operator/session.js";
import operatorCallback, { callbackTextHandler } from "./handlers/operator/callback.js";
import operatorStats from "./handlers/operator/stats.js";
import userFAQ from "./handlers/user/faq.js";
import userChat from "./handlers/user/chat.js";
import { loadConfig, validateConfig } from "./config/index.js";
import { sceneMiddleware } from "./scenes/index.js";

let logger: pino.Logger;
let pool: DatabasePool;
let bot: Telegraf<BotContext>;

async function main(args: CLIArgs): Promise<void> {
  if (args.help) {
    createProgram().help();
    process.exit(0);
  }

  logger = await createLogger(args);
  logger.info({ args }, "Starting bot with configuration");

  const config = loadConfig();
  validateConfig(config);

  pool = createDatabasePool(logger);
  await initializeSchema(pool, logger);

  bot = new Telegraf<BotContext>(config.botToken);

  bot.use(session());
  bot.use(createContextMiddleware(logger, pool));
  
  bot.use(sceneMiddleware);

  bot.command('scenes', async (ctx) => {
    await ctx.reply('Доступные сцены:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📚 FAQ', callback_data: 'enter_category' }],
          [{ text: '📞 Обратный звонок', callback_data: 'enter_callback' }],
          [{ text: '💼 Панель оператора', callback_data: 'enter_operator' }],
        ],
      },
    });
  });

  bot.action('enter_category', async (ctx) => {
    await ctx.answerCbQuery('Используйте /start для просмотра FAQ.');
  });

  bot.action('enter_callback', async (ctx) => {
    await ctx.answerCbQuery();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((ctx as any).scene) await (ctx as any).scene.enter('callback');
  });

  bot.action('enter_operator', async (ctx) => {
    await ctx.answerCbQuery('Чат-функция удалена. Используйте /support для создания заявки.');
  });

  // ── Help commands ──────────────────────────────────────────────

  /**
   * /admin - Shows admin commands (only if authenticated as admin).
   */
  bot.command("admin", async (ctx) => {
    if (ctx.session?.type !== "admin") {
      await ctx.reply("Неизвестная команда. Используйте /start для начала работы.");
      return;
    }
    await ctx.reply(
      "🔐 Команды администратора:\n\n" +
      "/admin_login — войти\n" +
      "/admin_logout — выйти\n" +
      "/admin_add_operator — добавить оператора\n" +
      "/admin_remove_operator — удалить оператора\n" +
      "/admin_list_operators — список операторов\n\n" +
      "/create_category — создать категорию FAQ\n" +
      "/delete_category — удалить категорию FAQ\n" +
      "/add_faq — добавить вопрос FAQ\n" +
      "/delete_faq — удалить вопрос FAQ\n" +
      "/stats — статистика"
    );
  });

  /**
   * /operator - Shows operator commands (only if authenticated as operator).
   */
  bot.command("operator", async (ctx) => {
    if (ctx.session?.type !== "operator") {
      await ctx.reply("Неизвестная команда. Используйте /start для начала работы.");
      return;
    }
    await ctx.reply(
      "💼 Команды оператора:\n\n" +
      "/operator_login — войти\n" +
      "/operator_logout — выйти\n" +
      "/operator_available — статус свободен\n" +
      "/operator_busy — статус занят\n" +
      "/requests — список заявок\n" +
      "/take — взять заявку (вход в чат)\n" +
      "/done — выполнить заявку (в чате)\n" +
      "/pause — поставить чат на паузу\n" +
      "/resume — возобновить чат\n" +
      "/unassign — вернуть заявку в пул\n" +
      "/comment <текст> — комментарий к заявке\n" +
      "/cancel_request — отменить заявку\n" +
      "/stats — статистика"
    );
  });

  /**
   * /debug - Shows all commands (only in debug mode, -d / --debug).
   */
  bot.command("debug", async (ctx) => {
    if (!args.debug) {
      await ctx.reply("Неизвестная команда. Используйте /start для начала работы.");
      return;
    }
    await ctx.reply(
      "🐛 Режим отладки\n\n" +
      "── Админ ──\n" +
      "/admin_login\n/admin_logout\n/admin_add_operator\n/admin_remove_operator\n/admin_list_operators\n" +
      "/create_category\n/delete_category\n/add_faq\n/delete_faq\n/stats\n\n" +
      "── Оператор ──\n" +
      "/operator_login\n/operator_logout\n/operator_available\n/operator_busy\n" +
      "/requests\n/take\n/done\n/pause\n/resume\n/unassign\n/comment\n/cancel_request\n/stats\n\n" +
      "── Пользователь ──\n" +
      "/start\n/menu\n/support\n/scenes"
    );
  });
  
  if (args.verbose) {
    bot.use(async (ctx, next) => {
      if (ctx.message && 'text' in ctx.message) {
        logger.debug({ 
          userId: ctx.from?.id, 
          command: ctx.message.text 
        }, 'User command received');
      }
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        logger.debug({ 
          userId: ctx.from?.id, 
          callbackData: ctx.callbackQuery.data 
        }, 'Callback query received');
      }
      await next();
    });
  }
  
  bot.use(createErrorHandlerMiddleware());

  // User handlers first (public commands: /start, /menu, /support)
  bot.use(userFAQ);
  bot.use(userChat);

  // Admin handlers (require auth)
  bot.use(adminSession);
  bot.use(adminFAQ);
  bot.use(adminFAQManage);
  bot.use(adminStats);
  bot.use(adminTextHandler);
  bot.use(adminFaqTextHandler);
  bot.use(adminFaqManageTextHandler);

  // Operator handlers (require auth)
  bot.use(operatorSession);
  bot.use(operatorCallback);
  bot.use(operatorStats);
  bot.use(callbackTextHandler);

  // Follow-up text handlers for pending auth operations
  bot.use(adminTextHandler);
  bot.use(operatorTextHandler);

  // Unknown command middleware at the very end — acts as fallback
  bot.use(createUnknownCommandMiddleware());

  const signalHandler = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Received shutdown signal");
    bot.stop(signal);
    await closeDatabasePool(pool, logger);
    process.exit(0);
  };

  process.on("SIGINT", () => signalHandler("SIGINT"));
  process.on("SIGTERM", () => signalHandler("SIGTERM"));

  const { host, port } = args;
  
  if (process.env.WEBHOOK_URL) {
    await bot.launch({ webhook: { domain: process.env.WEBHOOK_URL, port, host } });
  } else {
    await bot.launch();
  }
  
  logger.info({ mode: process.env.WEBHOOK_URL ? 'webhook' : 'long polling' }, "Bot launched");
}

const args = parseArgs();
main(args).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});