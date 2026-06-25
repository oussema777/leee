import { describe, it, expect } from "vitest";
import { signUnsubToken, verifyUnsubToken } from "./token";

const SECRET = "test-secret-please-change";

describe("unsubscribe token", () => {
  it("round-trips a payload", () => {
    const tok = signUnsubToken({ rid: "r1", cid: "c1" }, SECRET);
    expect(verifyUnsubToken(tok, SECRET)).toEqual({ rid: "r1", cid: "c1" });
  });
  it("rejects a tampered token", () => {
    const tok = signUnsubToken({ rid: "r1", cid: "c1" }, SECRET);
    expect(verifyUnsubToken(tok + "x", SECRET)).toBeNull();
  });
  it("rejects a wrong secret", () => {
    const tok = signUnsubToken({ rid: "r1", cid: "c1" }, SECRET);
    expect(verifyUnsubToken(tok, "other")).toBeNull();
  });
});
