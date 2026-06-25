import { describe, it, expect } from "vitest";
import { resolveRecipients } from "./recipients";

const contacts = [
  { email: "en@x.com", name: "EN", tags: ["EN", "partners"], status: "SUBSCRIBED" as const },
  { email: "ar@x.com", name: "AR", tags: ["AR"], status: "SUBSCRIBED" as const },
  { email: "off@x.com", name: "Off", tags: ["EN"], status: "UNSUBSCRIBED" as const },
];

describe("resolveRecipients", () => {
  it("matches any selected tag", () => {
    const r = resolveRecipients(contacts, ["EN"], new Set());
    expect(r.map((c) => c.email)).toEqual(["en@x.com"]);
  });
  it("matches multiple tags as a union", () => {
    const r = resolveRecipients(contacts, ["EN", "AR"], new Set());
    expect(r.map((c) => c.email).sort()).toEqual(["ar@x.com", "en@x.com"]);
  });
  it("excludes non-subscribed contacts", () => {
    const r = resolveRecipients(contacts, ["EN"], new Set());
    expect(r.find((c) => c.email === "off@x.com")).toBeUndefined();
  });
  it("excludes suppressed emails even if subscribed + tagged", () => {
    const r = resolveRecipients(contacts, ["EN"], new Set(["en@x.com"]));
    expect(r).toHaveLength(0);
  });
});
