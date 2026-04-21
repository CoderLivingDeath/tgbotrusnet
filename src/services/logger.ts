import pino from "pino";
import type { CLIArgs } from "../utils/cli.js";
import { getEnvValue } from "../utils/config-helper.js";

export type Logger = pino.Logger;

export function createLogger(config: CLIArgs): Logger {
  let level = process.env.LOG_LEVEL ?? "info";
  
  if (config.verbose) {
    level = "debug";
  }

  const logPath = config.logPath || getEnvValue('LOG_PATH') || undefined;
  const logPretty = config.logPretty && process.platform !== 'win32';

  if (logPath) {
    return pino({
      level,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: false,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          destination: logPath,
        },
      },
    });
  }

  if (logPretty) {
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