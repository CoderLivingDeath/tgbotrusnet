import { createToken, validateToken, revokeToken } from "../session";

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
});