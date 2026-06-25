import { describe, it, expect } from "vitest";
import { applyMergeTags, injectUnsubscribeFooter } from "./render";

describe("render", () => {
  it("replaces {{name}} (and falls back to empty)", () => {
    expect(applyMergeTags("Hi {{name}}", { name: "Sam" })).toBe("Hi Sam");
    expect(applyMergeTags("Hi {{name}}", { name: null })).toBe("Hi ");
  });
  it("injects a footer containing the unsubscribe URL", () => {
    const out = injectUnsubscribeFooter("<p>Body</p>", "https://x/u?token=abc", "EN");
    expect(out).toContain("https://x/u?token=abc");
    expect(out).toContain("Unsubscribe");
  });
  it("uses Arabic footer + RTL for AR", () => {
    const out = injectUnsubscribeFooter("<p>Body</p>", "https://x/u?token=abc", "AR");
    expect(out).toContain('dir="rtl"');
  });
});
