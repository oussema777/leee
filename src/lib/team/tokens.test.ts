import { describe, it, expect } from "vitest";
import { generateInviteToken } from "./tokens";

describe("generateInviteToken", () => {
  it("returns a URL-safe string of at least 32 chars", () => {
    const t = generateInviteToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it("returns a different value each call", () => {
    expect(generateInviteToken()).not.toBe(generateInviteToken());
  });
});
