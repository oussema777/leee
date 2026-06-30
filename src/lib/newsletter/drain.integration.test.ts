import { describe, it, expect } from "vitest";
import { nextBatchIndex, isCampaignDrained, idempotencyKeyFor } from "./drain";

const RETRY_BUDGET = 3;

interface LedgerRow {
  id: string;
  batchIndex: number;
  status: "PENDING" | "SENT" | "FAILED";
  attempts: number;
  sends: number;
}

type SendBatch = (batchRows: LedgerRow[]) => "ok" | "fail";

interface SimulateOptions {
  /** Stop the loop after this many successful (ok) batch sends. */
  maxSuccessfulSends?: number;
  /** Hard cap on loop iterations to guarantee termination. */
  maxIterations?: number;
}

/**
 * Mimics the route's drain loop using the real pure helpers over a mutable
 * in-memory ledger. No DB, no Resend, no route import.
 */
function simulateDrain(
  rows: LedgerRow[],
  sendBatch: SendBatch,
  opts: SimulateOptions = {}
): { iterations: number; successfulSends: number } {
  const maxIterations = opts.maxIterations ?? 1000;
  const maxSuccessfulSends = opts.maxSuccessfulSends ?? Infinity;

  let iterations = 0;
  let successfulSends = 0;

  while (iterations < maxIterations) {
    iterations++;

    const bi = nextBatchIndex(rows, RETRY_BUDGET);
    if (bi === null) {
      break; // campaign drained
    }

    const batchRows = rows.filter((r) => r.batchIndex === bi);
    const result = sendBatch(batchRows);

    if (result === "ok") {
      for (const r of batchRows) {
        r.status = "SENT";
        r.sends += 1;
      }
      successfulSends++;
      if (successfulSends >= maxSuccessfulSends) {
        break; // stop early (e.g. simulate partial run / crash)
      }
    } else {
      for (const r of batchRows) {
        r.status = "FAILED";
        r.attempts += 1;
      }
    }
  }

  return { iterations, successfulSends };
}

function makeLedger(batchCount: number, rowsPerBatch: number): LedgerRow[] {
  const rows: LedgerRow[] = [];
  for (let b = 0; b < batchCount; b++) {
    for (let i = 0; i < rowsPerBatch; i++) {
      rows.push({
        id: `b${b}-r${i}`,
        batchIndex: b,
        status: "PENDING",
        attempts: 0,
        sends: 0,
      });
    }
  }
  return rows;
}

describe("drainer simulation (resumability + idempotency)", () => {
  it("idempotencyKeyFor is stable per (campaign, batch)", () => {
    expect(idempotencyKeyFor("camp_1", 0)).toBe("camp_1:0");
    expect(idempotencyKeyFor("camp_1", 5)).toBe("camp_1:5");
    expect(idempotencyKeyFor("camp_1", 5)).toBe(idempotencyKeyFor("camp_1", 5));
  });

  it("1. happy path: all batches succeed, each row sent exactly once", () => {
    const rows = makeLedger(4, 3);

    const { iterations } = simulateDrain(rows, () => "ok");

    expect(iterations).toBeLessThan(1000);
    // Every row ends SENT.
    expect(rows.every((r) => r.status === "SENT")).toBe(true);
    // No duplicate sends.
    expect(rows.every((r) => r.sends === 1)).toBe(true);
    // No failures recorded.
    expect(rows.every((r) => r.attempts === 0)).toBe(true);
    // Campaign drained.
    expect(isCampaignDrained(rows, RETRY_BUDGET)).toBe(true);
    expect(nextBatchIndex(rows, RETRY_BUDGET)).toBeNull();
  });

  it("2. a batch fails once then succeeds on retry; no other batch double-sent", () => {
    const rows = makeLedger(4, 3);
    let batch1FailuresLeft = 1;

    const sendBatch: SendBatch = (batchRows) => {
      const bi = batchRows[0].batchIndex;
      if (bi === 1 && batch1FailuresLeft > 0) {
        batch1FailuresLeft -= 1;
        return "fail";
      }
      return "ok";
    };

    simulateDrain(rows, sendBatch);

    const batch1 = rows.filter((r) => r.batchIndex === 1);
    expect(batch1.every((r) => r.status === "SENT")).toBe(true);
    expect(batch1.every((r) => r.attempts === 1)).toBe(true);
    expect(batch1.every((r) => r.sends === 1)).toBe(true);

    // Every other batch sent exactly once, never failed.
    const others = rows.filter((r) => r.batchIndex !== 1);
    expect(others.every((r) => r.sends === 1)).toBe(true);
    expect(others.every((r) => r.attempts === 0)).toBe(true);
    expect(others.every((r) => r.status === "SENT")).toBe(true);

    // No row anywhere was double-sent.
    expect(rows.every((r) => r.sends === 1)).toBe(true);
    expect(isCampaignDrained(rows, RETRY_BUDGET)).toBe(true);
  });

  it("3. permanent failure on batch 2: exhausts retry budget, marked FAILED, campaign drained", () => {
    const rows = makeLedger(4, 3);

    const sendBatch: SendBatch = (batchRows) => {
      const bi = batchRows[0].batchIndex;
      return bi === 2 ? "fail" : "ok";
    };

    simulateDrain(rows, sendBatch);

    const batch2 = rows.filter((r) => r.batchIndex === 2);
    // FAILED, budget exhausted, never marked SENT.
    expect(batch2.every((r) => r.status === "FAILED")).toBe(true);
    expect(batch2.every((r) => r.attempts === RETRY_BUDGET)).toBe(true);
    // "sent" attempts-times (the send callback ran each attempt) but sends counter
    // only increments on ok, so these were never successfully sent.
    expect(batch2.every((r) => r.sends === 0)).toBe(true);

    // nextBatchIndex returns null even though batch 2 failed: budget exhausted.
    expect(nextBatchIndex(rows, RETRY_BUDGET)).toBeNull();
    expect(isCampaignDrained(rows, RETRY_BUDGET)).toBe(true);

    // Would-be campaign status.
    const campaignStatus = rows.some((r) => r.status === "FAILED")
      ? "FAILED"
      : "SENT";
    expect(campaignStatus).toBe("FAILED");

    // Other batches still went out exactly once.
    const others = rows.filter((r) => r.batchIndex !== 2);
    expect(others.every((r) => r.status === "SENT" && r.sends === 1)).toBe(true);
  });

  it("4. resume after partial send: already-SENT rows are not re-sent on re-run", () => {
    const rows = makeLedger(4, 3);

    // First run: stop after the first successful batch (batch 0).
    const first = simulateDrain(rows, () => "ok", { maxSuccessfulSends: 1 });
    expect(first.successfulSends).toBe(1);

    const batch0 = rows.filter((r) => r.batchIndex === 0);
    expect(batch0.every((r) => r.status === "SENT" && r.sends === 1)).toBe(true);

    // Remaining batches still pending; campaign not yet drained.
    expect(rows.some((r) => r.status === "PENDING")).toBe(true);
    expect(isCampaignDrained(rows, RETRY_BUDGET)).toBe(false);
    expect(nextBatchIndex(rows, RETRY_BUDGET)).toBe(1);

    // Re-run over the SAME ledger to completion.
    simulateDrain(rows, () => "ok");

    // Batch 0 was NOT re-sent.
    expect(batch0.every((r) => r.sends === 1)).toBe(true);
    // Everything is now SENT exactly once.
    expect(rows.every((r) => r.status === "SENT" && r.sends === 1)).toBe(true);
    expect(isCampaignDrained(rows, RETRY_BUDGET)).toBe(true);
  });
});
