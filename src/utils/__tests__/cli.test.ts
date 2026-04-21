import { parseArgs, createProgram, type CLIArgs } from "../cli";

describe("CLI Parser", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return default values when no args provided", () => {
    const args = parseArgs([]);
    expect(args.host).toBe("0.0.0.0");
    expect(args.port).toBe(3000);
    expect(args.logPath).toBe(false);
    expect(args.logPretty).toBe(true);
    expect(args.help).toBe(false);
  });

  it("should parse custom host and port", () => {
    const args = parseArgs(["--host", "127.0.0.1", "--port", "8080"]);
    expect(args.host).toBe("127.0.0.1");
    expect(args.port).toBe(8080);
  });

  it("should parse log-path", () => {
    const args = parseArgs(["--log-path", "/var/log/bot.log"]);
    expect(args.logPath).toBe("/var/log/bot.log");
  });

  it("should parse log-pretty boolean", () => {
    const argsTrue = parseArgs(["--log-pretty", "true"]);
    const argsFalse = parseArgs(["--log-pretty", "false"]);

    expect(argsTrue.logPretty).toBe(true);
    expect(argsFalse.logPretty).toBe(false);
  });

  it("should detect help flag", () => {
    const args = parseArgs(["--help"]);
    expect(args.help).toBe(true);
  });

  it("should create program with correct name", () => {
    const program = createProgram();
    expect(program.name()).toBe("bot");
  });
});