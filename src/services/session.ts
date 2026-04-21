import type { Session } from "../types/index";

/**
 * In-memory store for sessions keyed by token.
 */
const sessions = new Map<string, Session>();

/**
 * Creates a new authentication token for a user.
 * @param type - Token type: "admin" or "operator"
 * @param userId - The user's ID
 * @param expiryHours - Token expiration time in hours (default: 24)
 * @returns The generated token string
 */
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

/**
 * Validates a token and returns the associated session if valid.
 * @param token - The token string to validate
 * @returns The Session object if valid, null otherwise
 */
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

/**
 * Revokes a token, removing it from the session store.
 * @param token - The token to revoke
 * @returns True if the token was found and removed, false otherwise
 */
export function revokeToken(token: string): boolean {
  return sessions.delete(token);
}

/**
 * Revokes all active tokens, clearing the entire session store.
 */
export function revokeAllTokens(): void {
  sessions.clear();
}

/**
 * Returns all currently active (non-expired) sessions.
 * @returns Array of active Session objects
 */
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

/**
 * Retrieves an active session for a given user ID.
 * @param userId - The user's ID
 * @returns The Session object if found and not expired, null otherwise
 */
export function getSession(userId: number): Session | null {
  for (const session of sessions.values()) {
    if (session.user_id === userId && session.expires_at > new Date()) {
      return session;
    }
  }
  return null;
}

/**
 * Creates a new session for a user.
 * @param userId - The user's ID
 * @param type - Session type: "admin" or "operator"
 * @param data - Optional partial session data (e.g., custom expires_at)
 * @returns The created Session object
 */
export function createSession(
  userId: number,
  type: "admin" | "operator",
  data: Partial<Session> = {}
): Session {
  const expiryHours = data.expires_at
    ? Math.max(0, (new Date(data.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))
    : 24;
  const token = createToken(type, userId, expiryHours > 0 ? expiryHours : 24);
  const session: Session = {
    token,
    type,
    user_id: userId,
    expires_at: new Date(Date.now() + (expiryHours > 0 ? expiryHours : 24) * 60 * 60 * 1000),
  };
  return session;
}

/**
 * Updates an existing session with new data.
 * @param userId - The user's ID
 * @param updates - Partial session data to update
 * @returns The updated Session object, or null if session not found
 */
export function updateSession(userId: number, updates: Partial<Session>): Session | null {
  const existing = getSession(userId);
  if (!existing) return null;

  sessions.delete(existing.token);
  const updated: Session = {
    ...existing,
    ...updates,
    token: existing.token,
  };
  sessions.set(updated.token, updated);
  return updated;
}

/**
 * Deletes a session for a given user ID.
 * @param userId - The user's ID
 * @returns True if session was found and deleted, false otherwise
 */
export function deleteSession(userId: number): boolean {
  const session = getSession(userId);
  if (!session) return false;
  return sessions.delete(session.token);
}