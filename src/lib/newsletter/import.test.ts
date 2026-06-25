import { describe, it, expect } from "vitest";
import { planImport } from "./import";

const rows = [
  { email: "a@x.com", name: "A", tags: ["EN"] },
  { email: "sup@x.com", name: "S", tags: ["EN"] },
];

describe("planImport", () => {
  it("upserts non-suppressed rows as subscribed", () => {
    const plan = planImport(rows, new Set());
    expect(plan.toUpsert.map((r) => r.email)).toEqual(["a@x.com", "sup@x.com"]);
    expect(plan.suppressedKeptOff).toBe(0);
  });

  it("never re-subscribes a suppressed email", () => {
    const plan = planImport(rows, new Set(["sup@x.com"]));
    expect(plan.toUpsert.map((r) => r.email)).toEqual(["a@x.com"]);
    expect(plan.suppressedKeptOff).toBe(1);
  });
});
