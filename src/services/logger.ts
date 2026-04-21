import pino from "pino";
import type { CLIArgs } from "../utils/cli.js";

export type Logger = pino.Logger;

export function createLogger(config: CLIArgs): Logger {
  let level = process.env.LOG_LEVEL ?? "info";
  
  if (config.verbose) {
    level = "debug";
  }

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

  if (config.logPretty && process.platform !== 'win32') {
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