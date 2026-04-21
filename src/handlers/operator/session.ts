import { Composer } from "telegraf";
import type { BotContext } from "../../context/bot-context.js";
import { createToken } from "../../services/session.js";
import { setOperatorStatus, getAvailableOperators } from "../../services/chat.js";
import { loadConfig } from "../../config/index.js";
import { Operator } from "../../types/index.js";

const operatorComposer = new Composer<BotContext>();

operatorComposer.command("login", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  const password = args[0];

  if (!password) {
    await ctx.reply("Использование: /operator login <пароль>");
    return;
  }

  const config = loadConfig();

  if (password !== config.operatorPassword) {
    ctx.logger.warn({ userId: ctx.from?.id }, "Failed operator login attempt");
    await ctx.reply("Неверный пароль");
    return;
  }

  const token = createToken("operator", ctx.from!.id, config.sessionExpiryHours);

  const operators = await getAvailableOperators(ctx.db);
  const operator = operators.find((o: Operator) => o.user_id === ctx.from!.id);

  if (operator) {
    await setOperatorStatus(ctx.db, operator.id, true);
  }

  ctx.session = {
    type: "operator",
    userId: ctx.from!.id,
    token,
  };

  ctx.logger.info({ userId: ctx.from?.id }, "Operator logged in");
  await ctx.reply("Вы вошли как оператор");
});

operatorComposer.command("logout", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация. Используйте /operator login <пароль>");
    return;
  }

  const operators = await getAvailableOperators(ctx.db);
  const operator = operators.find((o: Operator) => o.user_id === ctx.from!.id);

  if (operator) {
    await setOperatorStatus(ctx.db, operator.id, false);
  }

  ctx.session = undefined;
  await ctx.reply("Вы вышли из системы");
});

operatorComposer.command("available", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация");
    return;
  }

  const operators = await getAvailableOperators(ctx.db);
  const operator = operators.find((o: Operator) => o.user_id === ctx.from!.id);

  if (operator) {
    await setOperatorStatus(ctx.db, operator.id, true);
    await ctx.reply("Статус: доступен");
  }
});

operatorComposer.command("busy", async (ctx) => {
  if (ctx.session?.type !== "operator") {
    await ctx.reply("Требуется авторизация");
    return;
  }

  const operators = await getAvailableOperators(ctx.db);
  const operator = operators.find((o: Operator) => o.user_id === ctx.from!.id);

  if (operator) {
    await setOperatorStatus(ctx.db, operator.id, false);
    await ctx.reply("Статус: занят");
  }
});

export default operatorComposer;