import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeShipping, shippingJson as json } from "@/lib/aramex/access";
import { RECOVERY_WAIT_MS, reconcileShipment, ReconciliationError } from "@/lib/aramex/reconciliation";

type Context = { params: Promise<{ id: string }> };
const errors: Record<string, string> = {
  INVALID_RECONCILIATION: "Complete the evidence, confirmation and tracking fields.",
  SHIPMENT_MISSING: "No shipment record was found.", UAT_ONLY: "This recovery flow currently supports UAT only.",
  ALREADY_RESOLVED: "This attempt has already been resolved. Reload its latest status.",
  STALE_REVIEW: "The shipment changed. Reload and review the latest attempt.",
  REQUEST_STILL_RECENT: "Wait at least five minutes after the attempt started, then reload. A request may still be completing.",
};
function failure(error: unknown) {
  if (error instanceof ReconciliationError) return json({ error: errors[error.message] ?? "Unable to reconcile this attempt." }, error.message === "INVALID_RECONCILIATION" ? 400 : 409);
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P2021") return json({ error: "Recovery storage is not installed yet. Contact the developer; do not retry the shipment." }, 503);
    if (error.code === "P2002") return json({ error: "This tracking number or attempt is already recorded. Reload and verify it before continuing." }, 409);
  }
  return json({ error: "Unable to record recovery. Reload to check its status before trying again." }, 500);
}
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const auth = await authorizeShipping(request); if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const shipment = await db.bookShipment.findUnique({ where: { orderId: id }, select: {
      id: true, status: true, environment: true, updatedAt: true,
      attempts: { take: 1, orderBy: [{ startedAt: "desc" }, { id: "desc" }], select: {
        id: true, submissionKey: true, status: true, startedAt: true, reconciliation: true,
      } },
    } });
    if (!shipment) return json({ error: "No shipment record was found." }, 404);
    const attempt = shipment.attempts[0];
    return json({ status: shipment.status, environment: shipment.environment, updatedAt: shipment.updatedAt,
      attempt: attempt ? { ...attempt, availableAt: new Date(attempt.startedAt.getTime() + RECOVERY_WAIT_MS) } : null });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const auth = await authorizeShipping(request); if (auth instanceof NextResponse) return auth;
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Send JSON." }, 415);
    const reader = request.body?.getReader(); if (!reader) return json({ error: "Missing request." }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 16_384) { await reader.cancel(); return json({ error: "Recovery request is too large." }, 413); }
      chunks.push(value);
    }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return json({ error: "Invalid JSON." }, 400); }
    const { id } = await params;
    const result = await reconcileShipment(db, id, body, auth.userId);
    return json({ status: result.status });
  } catch (error) { return failure(error); }
}
