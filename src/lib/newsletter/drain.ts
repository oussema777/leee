export interface DrainRow { batchIndex: number; status: "PENDING" | "SENT" | "FAILED"; attempts: number; }

function isUnsent(r: DrainRow, retryBudget: number): boolean {
  return r.status === "PENDING" || (r.status === "FAILED" && r.attempts < retryBudget);
}

export function nextBatchIndex(rows: DrainRow[], retryBudget: number): number | null {
  const unsent = rows.filter((r) => isUnsent(r, retryBudget)).map((r) => r.batchIndex);
  return unsent.length ? Math.min(...unsent) : null;
}

export function idempotencyKeyFor(campaignId: string, batchIndex: number): string {
  return `${campaignId}:${batchIndex}`;
}

export function isCampaignDrained(rows: DrainRow[], retryBudget: number): boolean {
  return nextBatchIndex(rows, retryBudget) === null;
}
