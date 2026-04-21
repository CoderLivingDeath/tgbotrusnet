import 'dotenv/config';
import { Telegraf } from "telegraf";
import { parseArgs, createProgram, type CLIArgs } from "./utils/cli.js";
import { createLogger, type Logger } from "./services/logger.js";
import { createDatabasePool, closeDatabasePool, type DatabasePool } from "./services/database.js";
import { createContextMiddleware, type BotContext } from "./context/bot-context.js";
import { createErrorHandlerMiddleware, createUnknownCommandMiddleware } from "./middleware/error-handler.js";
import { initializeSchema } from "./services/schema.js";
import adminSession from "./handlers/admin/session.js";
import adminFAQ from "./handlers/admin/faq.js";
import adminFAQManage from "./handlers/admin/faq-manage.js";
import adminStats from "./handlers/admin/stats.js";
import operatorSession from "./handlers/operator/session.js";
import operatorChat from "./handlers/operator/chat.js";
import operatorStats from "./handlers/operator/stats.js";
import userFAQ from "./handlers/user/faq.js";
import userSearch from "./handlers/user/search.js";
import userChat from "./handlers/user/chat.js";
import { loadConfig, validateConfig } from "./config/index.js";

let logger: Logger;
let pool: DatabasePool;
let bot: Telegraf<BotContext>;

async function main(args: CLIArgs): Promise<void> {
  if (args.help) {
    createProgram().help();
    process.exit(0);
  }

  logger = createLogger(args);
  logger.info({ args }, "Starting bot with configuration");

  const config = loadConfig();
  validateConfig(config);

  pool = createDatabasePool(logger);
  await initializeSchema(pool, logger);

  bot = new Telegraf<BotContext>(config.botToken);

  bot.use(createContextMiddleware(logger, pool));
  
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
  bot.use(createUnknownCommandMiddleware());

  // User handlers first (public commands: /start, /menu, /search, /support, /end)
  bot.use(userFAQ);
  bot.use(userSearch);
  bot.use(userChat);

  // Admin handlers (require auth)
  bot.use(adminSession);
  bot.use(adminFAQ);
  bot.use(adminFAQManage);
  bot.use(adminStats);

  // Operator handlers (require auth)
  bot.use(operatorSession);
  bot.use(operatorChat);
  bot.use(operatorStats);

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