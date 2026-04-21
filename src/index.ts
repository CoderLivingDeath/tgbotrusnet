import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN ?? "");

bot.start((ctx) => {
  ctx.reply("Hello!");
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
