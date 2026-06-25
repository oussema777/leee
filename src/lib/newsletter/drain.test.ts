import { describe, it, expect } from "vitest";
import { nextBatchIndex, idempotencyKeyFor, isCampaignDrained } from "./drain";

type R = { batchIndex: number; status: "PENDING" | "SENT" | "FAILED"; attempts: number };
const B = 3;

describe("drain helpers", () => {
  it("returns lowest batch with un-sent rows", () => {
    const rows: R[] = [
      { batchIndex: 0, status: "SENT", attempts: 1 },
      { batchIndex: 1, status: "PENDING", attempts: 0 },
      { batchIndex: 2, status: "PENDING", attempts: 0 },
    ];
    expect(nextBatchIndex(rows, B)).toBe(1);
  });
  it("treats FAILED under retry budget as un-sent, but not when exhausted", () => {
    expect(nextBatchIndex([{ batchIndex: 5, status: "FAILED", attempts: 2 }], B)).toBe(5);
    expect(nextBatchIndex([{ batchIndex: 5, status: "FAILED", attempts: 3 }], B)).toBeNull();
  });
  it("returns null when everything is sent", () => {
    expect(nextBatchIndex([{ batchIndex: 0, status: "SENT", attempts: 1 }], B)).toBeNull();
  });
  it("derives a deterministic idempotency key", () => {
    expect(idempotencyKeyFor("c1", 2)).toBe("c1:2");
  });
  it("isCampaignDrained mirrors nextBatchIndex === null", () => {
    expect(isCampaignDrained([{ batchIndex: 0, status: "SENT", attempts: 1 }], B)).toBe(true);
  });
});
