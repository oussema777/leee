import { afterEach, expect, it, vi } from "vitest";
import { decryptSession, encryptSession } from "./session-storage";
afterEach(() => vi.unstubAllEnvs());
it("encrypts sessions and binds them to their attempt", () => {
  vi.stubEnv("JWT_SECRET", "test-secret".repeat(5));
  const value = { sessionJwt: "private-session" }, encrypted = encryptSession(value, "first");
  expect(encrypted).not.toContain(value.sessionJwt);
  expect(decryptSession(encrypted, "first")).toEqual(value);
  expect(() => decryptSession(encrypted, "second")).toThrow();
  expect(encryptSession(value, "first")).not.toBe(encrypted);
  const parts = encrypted.split("."); parts[1] = Buffer.alloc(16).toString("base64url");
  expect(() => decryptSession(parts.join("."), "first")).toThrow();
});
it("fails closed without a storage secret", () => { vi.stubEnv("JWT_SECRET", ""); expect(() => encryptSession({}, "first")).toThrow("KEY_MISSING"); });
