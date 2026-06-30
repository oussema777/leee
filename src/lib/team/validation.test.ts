import { describe, it, expect } from "vitest";
import { validateSubmission } from "./validation";

const base = { name: "Sara", title: "Partnerships Manager", locale: "en" };

describe("validateSubmission", () => {
  it("accepts a minimal valid submission", () => {
    const r = validateSubmission(base);
    expect(r.ok).toBe(true);
  });
  it("rejects missing name or title", () => {
    expect(validateSubmission({ ...base, name: "  " }).ok).toBe(false);
    expect(validateSubmission({ ...base, title: "" }).ok).toBe(false);
  });
  it("rejects an invalid locale", () => {
    expect(validateSubmission({ ...base, locale: "fr" }).ok).toBe(false);
  });
  it("rejects malformed social URLs", () => {
    expect(validateSubmission({ ...base, linkedinUrl: "not a url" }).ok).toBe(false);
  });
  it("rejects oversized name/title", () => {
    expect(validateSubmission({ ...base, name: "x".repeat(121) }).ok).toBe(false);
    expect(validateSubmission({ ...base, title: "x".repeat(201) }).ok).toBe(false);
  });
  it("rejects an oversized URL", () => {
    const longUrl = "https://example.com/" + "a".repeat(500);
    expect(validateSubmission({ ...base, websiteUrl: longUrl }).ok).toBe(false);
  });
  it("rejects a photoUrl outside our domain", () => {
    const host = "wqphvlzndbwqgcojipvn.supabase.co";
    expect(validateSubmission({ ...base, photoUrl: "https://evil.com/x.jpg" }, host).ok).toBe(false);
  });
  it("accepts a relative photo path with no allowedHost", () => {
    expect(validateSubmission({ ...base, photoUrl: "/uploads/programs/x.jpg" }, null).ok).toBe(true);
  });
  it("accepts a photoUrl on our supabase bucket", () => {
    const host = "wqphvlzndbwqgcojipvn.supabase.co";
    const url = `https://${host}/storage/v1/object/public/uploads/programs/x.jpg`;
    expect(validateSubmission({ ...base, photoUrl: url }, host).ok).toBe(true);
  });
  it("ignores unknown fields", () => {
    const r = validateSubmission({ ...base, evil: "x" } as any);
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.value as any).evil).toBeUndefined();
  });
});
