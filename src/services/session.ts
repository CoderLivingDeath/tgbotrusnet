import type { Session } from "../types/index.js";

const sessions = new Map<string, Session>();

export function createToken(
  type: "admin" | "operator",
  userId: number,
  expiryHours: number = 24
): string {
  const token = `${type}-${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  const expiresAt = expiryHours <= 0
    ? new Date(Date.now() - 1)
    : new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  sessions.set(token, { token, type, user_id: userId, expires_at: expiresAt });

  return token;
}

export function validateToken(token: string): Session | null {
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  if (new Date() > session.expires_at) {
    sessions.delete(token);
    return null;
  }

  return session;
}

export function revokeToken(token: string): boolean {
  return sessions.delete(token);
}

export function revokeAllTokens(): void {
  sessions.clear();
}

export function getActiveSessions(): Session[] {
  const now = new Date();
  const active: Session[] = [];

  sessions.forEach((session) => {
    if (session.expires_at > now) {
      active.push(session);
    }
  });

  return active;
}