export interface Config {
  botToken: string;
  databaseUrl: string;
  sessionExpiryHours: number;
  adminUserId: string;
  adminPassword: string;
  operatorPassword: string;
}

export function loadConfig(): Config {
  return {
    botToken: process.env.BOT_TOKEN ?? "",
    databaseUrl: process.env.DATABASE_URL ?? "",
    sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS ?? "24", 10),
    adminUserId: process.env.ADMIN_USER_ID ?? "",
    adminPassword: process.env.ADMIN_PASSWORD ?? "",
    operatorPassword: process.env.OPERATOR_PASSWORD ?? "",
  };
}

export function validateConfig(config: Config): void {
  if (!config.botToken) {
    throw new Error("BOT_TOKEN is required");
  }
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
}