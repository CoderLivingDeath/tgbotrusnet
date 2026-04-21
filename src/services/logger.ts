import pino from "pino";
import type { CLIArgs } from "../utils/cli.js";

export type Logger = pino.Logger;

export function createLogger(config: CLIArgs): Logger {
  const level = process.env.LOG_LEVEL ?? "info";

  if (config.logPath) {
    return pino({
      level,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: false,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          destination: config.logPath,
        },
      },
    });
  }

  if (config.logPretty) {
    return pino({
      level,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });
  }

  return pino({ level });
}