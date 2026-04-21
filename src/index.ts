import { Telegraf } from "telegraf";
import { parseArgs, showHelp, type CLIArgs } from "./utils/cli.js";
import { createLogger, type Logger } from "./services/logger.js";
import { createDatabasePool, closeDatabasePool, type DatabasePool } from "./services/database.js";
import { createContextMiddleware, type BotContext } from "./context/bot-context.js";

let logger: Logger;
let pool: DatabasePool;
let bot: Telegraf<BotContext>;

async function main(args: CLIArgs): Promise<void> {
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  logger = createLogger(args);
  logger.info({ args }, "Starting bot with configuration");

  pool = createDatabasePool(logger);
  bot = new Telegraf<BotContext>(process.env.BOT_TOKEN ?? "");

  bot.use(createContextMiddleware(logger, pool));

  bot.command("start", (ctx) => {
    ctx.reply("Bot is running!");
  });

  bot.on("message", (ctx) => {
    ctx.logger.debug({ update: ctx.update }, "Received message");
  });

  const signalHandler = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Received shutdown signal");
    bot.stop(signal);
    await closeDatabasePool(pool, logger);
    process.exit(0);
  };

  process.on("SIGINT", () => signalHandler("SIGINT"));
  process.on("SIGTERM", () => signalHandler("SIGTERM"));

  const { host, port } = args;
  await bot.launch({ webhook: { domain: "", path: "", port, host } });
  logger.info({ host, port }, "Bot launched");
}

const args = parseArgs();
main(args).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});