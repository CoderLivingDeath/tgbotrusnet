import { getEnvValue } from "../../src/utils/config-helper";

jest.mock("../../src/utils/config-helper", () => ({
  getEnvValue: (key: string): string | undefined => {
    if (key === "LOG_LEVEL") return process.env.LOG_LEVEL;
    if (key === "LOG_CONSOLE") return "true";
    if (key === "LOG_FILE") return undefined;
    if (key === "LOG_VERBOSE_FILE") return undefined;
    return undefined;
  },
}));

import { createLogger } from "../../src/services/logger";

describe("Logger Service", () => {
  it("should create a logger with default configuration", async () => {
    const logger = await createLogger({
      host: "0.0.0.0",
      port: 3000,
      logPath: false,
      logPretty: false,
      help: false,
      verbose: false,
      debug: false,
    });

    expect(logger).toBeDefined();
    expect(logger.level).toBe("info");
  });

  it("should create a logger with custom level", async () => {
    const originalLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = "debug";

    const logger = await createLogger({
      host: "0.0.0.0",
      port: 3000,
      logPath: false,
      logPretty: false,
      help: false,
      verbose: false,
      debug: false,
    });

    expect(logger.level).toBe("debug");

    if (originalLevel !== undefined) {
      process.env.LOG_LEVEL = originalLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  it("should create a logger with debug level when verbose is true", async () => {
    const logger = await createLogger({
      host: "0.0.0.0",
      port: 3000,
      logPath: false,
      logPretty: false,
      help: false,
      verbose: true,
      debug: false,
    });

    expect(logger.level).toBe("debug");
  });
});
