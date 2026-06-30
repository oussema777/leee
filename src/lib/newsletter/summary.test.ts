import { describe, it, expect } from "vitest";
import { computeSummary } from "./summary";

describe("computeSummary", () => {
  it("computes rates over delivered", () => {
    const s = computeSummary({ sent: 100, delivered: 80, uniqueOpens: 40, uniqueClicks: 8, unsubscribes: 2, bounces: 5 });
    expect(s.openRate).toBeCloseTo(0.5);
    expect(s.clickRate).toBeCloseTo(0.1);
  });
  it("guards divide-by-zero", () => {
    const s = computeSummary({ sent: 0, delivered: 0, uniqueOpens: 0, uniqueClicks: 0, unsubscribes: 0, bounces: 0 });
    expect(s.openRate).toBe(0);
    expect(s.clickRate).toBe(0);
  });
});
