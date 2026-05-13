import { createToken, validateToken, revokeToken, getSession, createSession, updateSession, deleteSession } from "../../src/services/session";

describe("Session Service", () => {
  beforeEach(() => {
    revokeToken("admin-123-999999999");
    revokeToken("operator-456-999999999");
    revokeToken("admin-222-999999999");
  });

  describe("createToken", () => {
    it("should create a token with correct type", () => {
      const token = createToken("admin", 123, 24);
      expect(token.startsWith("admin-123-")).toBe(true);
    });

    it("should create a token that can be validated", () => {
      const token = createToken("operator", 456, 24);
      const session = validateToken(token);
      expect(session).not.toBe(null);
      expect(session?.type).toBe("operator");
      expect(session?.user_id).toBe(456);
    });
  });

  describe("validateToken", () => {
    it("should return null for invalid token", () => {
      const session = validateToken("invalid-token-123");
      expect(session).toBe(null);
    });

    it("should return null for non-existent token", () => {
      const session = validateToken("admin-999-999999999");
      expect(session).toBe(null);
    });

    it("should return null for expired token", () => {
      const token = createToken("admin", 111, 0);
      const session = validateToken(token);
      expect(session).toBe(null);
    });
  });

  describe("revokeToken", () => {
    it("should revoke existing token", () => {
      const token = createToken("admin", 222, 24);
      const result = revokeToken(token);
      expect(result).toBe(true);

      const session = validateToken(token);
      expect(session).toBe(null);
    });

    it("should return false for non-existent token", () => {
      const result = revokeToken("admin-999-999999999");
      expect(result).toBe(false);
    });
  });

  describe("getSession", () => {
    it("should return existing session", () => {
      const token = createToken("admin", 999, 24);
      const session = getSession(999);
      expect(session).not.toBe(null);
      expect(session?.user_id).toBe(999);
      expect(session?.type).toBe("admin");
    });

    it("should return null for non-existing session", () => {
      const session = getSession(888888);
      expect(session).toBe(null);
    });
  });

  describe("createSession", () => {
    it("should create new session", () => {
      const session = createSession(777, "operator");
      expect(session).not.toBe(null);
      expect(session.user_id).toBe(777);
      expect(session.type).toBe("operator");
    });
  });

  describe("updateSession", () => {
    it("should update existing session", () => {
      createSession(666, "admin");
      const updated = updateSession(666, { type: "operator" });
      expect(updated).not.toBe(null);
      expect(updated?.type).toBe("operator");
    });

    it("should return null for non-existing session", () => {
      const updated = updateSession(555555, { type: "admin" });
      expect(updated).toBe(null);
    });
  });

  describe("deleteSession", () => {
    it("should remove session", () => {
      createSession(444, "admin");
      const result = deleteSession(444);
      expect(result).toBe(true);
      expect(getSession(444)).toBe(null);
    });

    it("should return false for non-existing session", () => {
      const result = deleteSession(333333);
      expect(result).toBe(false);
    });
  });
});
