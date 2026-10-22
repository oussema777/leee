import { NextRequest, NextResponse } from "next/server";
import { authorizeShipping, shippingJson } from "@/lib/aramex/access";
import { submissionAvailability } from "@/lib/aramex/submission-status";
import { db } from "@/lib/db";
import { configuredSubmissionTransport, submissionInputSchema, validateSubmissionSchedule } from "@/lib/aramex/submission-config";
import { submitSavedShipment, SubmissionError } from "@/lib/aramex/submission";
import { ShipmentMappingError } from "@/lib/aramex/shipment-request";
import { safeLabelUrl } from "@/lib/aramex/submission-status";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeShipping(request);
    if (auth instanceof NextResponse) return auth;
    try {
      const date = new Date().toISOString();
      configuredSubmissionTransport({ shippingAt: date, dueAt: date });
      return shippingJson({ available: true });
    } catch { return shippingJson({ available: false }); }
  } catch { return shippingJson({ error: "Unable to check test shipment availability." }, 503); }
}
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeShipping(request);
    if (auth instanceof NextResponse) return auth;
    if (process.env.ARAMEX_UAT_SUBMISSION_ENABLED !== "true") {
      return shippingJson({ error: submissionAvailability.reason, code: "SUBMISSION_DISABLED" }, 503);
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) return shippingJson({ error: "Send JSON." }, 415);
    const reader = request.body?.getReader();
    if (!reader) return shippingJson({ error: "Review the saved draft and test shipment dates." }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return shippingJson({ error: "Request is too large." }, 413); }
      chunks.push(value);
    }
    let raw: unknown;
    try { raw = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { return shippingJson({ error: "Invalid JSON." }, 400); }
    const parsed = submissionInputSchema.safeParse(raw);
    if (!parsed.success || !validateSubmissionSchedule(parsed.data)) return shippingJson({
      error: "Confirm UAT testing and the saved draft version. Choose a future shipping time within 7 days and a due time within 30 days of shipping, including timezone.",
    }, 400);
    let transport;
    try { transport = configuredSubmissionTransport({ shippingAt: parsed.data.shippingAt, dueAt: parsed.data.dueAt }); }
    catch { return shippingJson({ error: "Verified UAT account and shipment settings are required before sending.", code: "SUBMISSION_NOT_CONFIGURED" }, 503); }
    if (request.signal.aborted) return shippingJson({ error: "Request cancelled before submission." }, 409);
    const shipment = await submitSavedShipment(db, { orderId: (await context.params).id,
      expectedDraftVersion: parsed.data.expectedDraftVersion, actor: auth.userId }, transport);
    // Never return preparation, credentials, full Prisma rows or raw carrier messages.
    return shippingJson({ status: shipment.status, environment: shipment.environment,
      trackingNumber: shipment.trackingNumber, labelUrl: safeLabelUrl(shipment.labelUrl),
      requiresReview: ["UNKNOWN", "SUBMITTING", "REJECTED"].includes(shipment.status) });
  } catch (error) {
    if (error instanceof SubmissionError) return shippingJson({ code: error.message,
      error: "Reload the saved shipment and review its status before any further attempt. An uncertain booking must be verified with Aramex.",
    }, error.message === "ORDER_MISSING" ? 404 : 409);
    if (error instanceof ShipmentMappingError) return shippingJson({ code: error.message,
      error: "The saved recipient or parcel details do not meet the configured UAT requirements. Review the draft before sending.",
    }, 422);
    return shippingJson({ error: "Unable to complete submission. Reload the shipment to check whether an attempt was recorded before trying again." }, 503);
  }
}
