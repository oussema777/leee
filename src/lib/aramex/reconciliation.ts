import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { lockOrder } from "@/lib/book-orders/whish-server";
import { safeLabelUrl } from "./submission-status";

export const RECOVERY_WAIT_MS = 5 * 60_000;
const evidence = z.string().trim().min(10).max(1000).refine(value => !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value));
export const reconciliationSchema = z.object({
  expectedAttemptId: z.string().min(1).max(100), expectedUpdatedAt: z.string().datetime(),
  outcome: z.enum(["CREATED", "NOT_CREATED"]),
  evidenceSource: z.enum(["ARAMEX_SUPPORT", "CARRIER_PORTAL"]),
  evidenceReference: evidence, notes: evidence,
  confirmed: z.literal(true),
  trackingNumber: z.string().regex(/^[A-Za-z0-9-]{5,50}$/).or(z.literal("")),
  labelUrl: z.string().max(4096).refine(value => value === "" || safeLabelUrl(value) !== null),
}).strict().superRefine((value, ctx) => {
  if (value.outcome === "CREATED" && !value.trackingNumber) ctx.addIssue({ code: "custom", path: ["trackingNumber"], message: "Enter the confirmed tracking number." });
  if (value.outcome === "NOT_CREATED" && (value.trackingNumber || value.labelUrl)) ctx.addIssue({ code: "custom", path: ["outcome"], message: "A no-booking confirmation cannot include a tracking number or label." });
});
export class ReconciliationError extends Error {}

// No carrier calls: this records evidence staff have independently verified.
// Preserve attempts and add one immutable application-level audit entry.
export async function reconcileShipment(db: PrismaClient, orderId: string, raw: unknown, actor: string) {
  const parsed = reconciliationSchema.safeParse(raw);
  if (!parsed.success) throw new ReconciliationError("INVALID_RECONCILIATION");
  const input = parsed.data;
  return db.$transaction(async tx => {
    await lockOrder(tx, orderId);
    const shipment = await tx.bookShipment.findUnique({ where: { orderId } });
    if (!shipment) throw new ReconciliationError("SHIPMENT_MISSING");
    if (shipment.provider !== "ARAMEX" || shipment.environment !== "UAT") throw new ReconciliationError("UAT_ONLY");
    if (!["UNKNOWN", "SUBMITTING"].includes(shipment.status)) throw new ReconciliationError("ALREADY_RESOLVED");
    if (shipment.updatedAt.toISOString() !== input.expectedUpdatedAt) throw new ReconciliationError("STALE_REVIEW");
    const attempt = await tx.bookShipmentAttempt.findFirst({ where: { shipmentId: shipment.id }, orderBy: [{ startedAt: "desc" }, { id: "desc" }] });
    if (!attempt || attempt.id !== input.expectedAttemptId || !["UNKNOWN", "SUBMITTING"].includes(attempt.status)) throw new ReconciliationError("STALE_REVIEW");
    if (Date.now() - attempt.startedAt.getTime() < RECOVERY_WAIT_MS) throw new ReconciliationError("REQUEST_STILL_RECENT");
    if (await tx.bookShipmentReconciliation.findUnique({ where: { attemptId: attempt.id } })) throw new ReconciliationError("ALREADY_RESOLVED");
    const created = input.outcome === "CREATED";
    const trackingNumber = created ? input.trackingNumber : null;
    const labelUrl = created ? safeLabelUrl(input.labelUrl) : null;
    await tx.bookShipmentReconciliation.create({ data: {
      attemptId: attempt.id, outcome: input.outcome, previousShipmentStatus: shipment.status,
      previousAttemptStatus: attempt.status, evidenceSource: input.evidenceSource,
      evidenceReference: input.evidenceReference, notes: input.notes, trackingNumber, labelUrl, actor,
    } });
    const status = created ? "CREATED" : "REJECTED";
    await tx.bookShipmentAttempt.update({ where: { id: attempt.id }, data: {
      status, trackingNumber, labelUrl, finishedAt: new Date(),
      failureCode: created ? null : "MANUALLY_CONFIRMED_NOT_CREATED",
    } });
    // NOT_CREATED returns to review, never directly to a retryable DRAFT.
    // Do not change order/payment/delivery status or refresh the order fingerprint.
    return tx.bookShipment.update({ where: { id: shipment.id }, data: {
      status, trackingNumber, labelUrl, bookedAt: created ? new Date() : null, updatedBy: actor,
    } });
  });
}
