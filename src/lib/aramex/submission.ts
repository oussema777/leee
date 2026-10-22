import { randomUUID } from "node:crypto";
import { canonicalLebanonCity } from "./cities";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { lockOrder } from "@/lib/book-orders/whish-server";
import { preparationSchema, prepareShipment, orderProblems, type ShipmentPreparation } from "./preparation";
import { shippingOrderFingerprint } from "./drafts";
import { safeLabelUrl } from "./submission-status";

// Internal adapter contract, not the Aramex wire format. The account-specific
// mapper and UAT transport exist, but account configuration is unverified and
// application submission remains disabled.
// A rejected outcome must mean Aramex definitively confirmed NO shipment exists.
// HTTP errors, malformed responses, disconnects and timeouts are UNKNOWN.
export interface ShipmentTransport {
  environment: "UAT";
  validatePreparation?(preparation: ShipmentPreparation): void;
  createShipment(request: {
    submissionKey: string; preparation: ShipmentPreparation;
  }, signal: AbortSignal): Promise<unknown>;
}
const outcomeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("created"), trackingNumber: z.string().regex(/^[A-Za-z0-9-]{5,50}$/), labelUrl: z.unknown().optional() }).strict(),
  z.object({ kind: z.literal("rejected"), code: z.enum(["VALIDATION", "ACCOUNT", "SERVICE"]) }).strict(),
  z.object({ kind: z.literal("unknown") }).strict(),
]);
type Outcome = z.output<typeof outcomeSchema>;

export class SubmissionError extends Error {}

// Used by the default-off UAT route and isolated simulation tests.
export async function submitSavedShipment(
  db: PrismaClient,
  input: { orderId: string; expectedDraftVersion: number; actor: string },
  transport: ShipmentTransport,
  timeoutMs = 20_000,
) {
  if (transport.environment !== "UAT") throw new SubmissionError("ENVIRONMENT_NOT_ALLOWED");
  const claim = await db.$transaction(async tx => {
    await lockOrder(tx, input.orderId);
    const order = await tx.bookOrder.findUnique({ where: { id: input.orderId }, include: { whishPayment: { select: { state: true } } } });
    if (!order) throw new SubmissionError("ORDER_MISSING");
    const shipment = await tx.bookShipment.findUnique({ where: { orderId: input.orderId } });
    if (!shipment) throw new SubmissionError("SAVE_DRAFT_FIRST");
    if (shipment.environment !== transport.environment || shipment.provider !== "ARAMEX") throw new SubmissionError("ENVIRONMENT_NOT_ALLOWED");
    // A repeated click on a completed request returns the existing booking.
    if (shipment.status === "CREATED") return { kind: "existing", shipment } as const;
    if (shipment.status === "REJECTED") throw new SubmissionError("REVIEW_REJECTED_DRAFT");
    if (shipment.status !== "DRAFT") throw new SubmissionError("CONFIRMATION_REQUIRED");
    if (shipment.version !== input.expectedDraftVersion) throw new SubmissionError("STALE_DRAFT");
    if (orderProblems(order).length) throw new SubmissionError("ORDER_NOT_ELIGIBLE");
    const fingerprint = shippingOrderFingerprint(order);
    if (shipment.orderFingerprint !== fingerprint) throw new SubmissionError("STALE_ORDER");
    const parsed = preparationSchema.safeParse(shipment.input);
    if (!parsed.success) throw new SubmissionError("INVALID_DRAFT");
    if (!canonicalLebanonCity(parsed.data.city)) throw new SubmissionError("CITY_CONFIRMATION_REQUIRED");
    // Order read receipts can change the timestamp; the material fingerprint was
    // checked above. Recompute every amount from the current locked order.
    const preparation = prepareShipment(order, { ...parsed.data, expectedUpdatedAt: order.updatedAt.toISOString() });
    // Local mapping/config errors must not consume an attempt or become UNKNOWN.
    transport.validatePreparation?.(preparation);
    const attempt = await tx.bookShipmentAttempt.create({ data: {
      shipmentId: shipment.id, submissionKey: randomUUID(), draftVersion: shipment.version,
      preparation, orderFingerprint: fingerprint, actor: input.actor,
    } });
    await tx.bookShipment.update({ where: { id: shipment.id }, data: { status: "SUBMITTING", updatedBy: input.actor } });
    return { kind: "claimed", attempt, preparation } as const;
  });
  if (claim.kind === "existing") return claim.shipment;

  // No database locks are held across network I/O. The persisted claim blocks
  // duplicate sends even after a worker crash. Never automatically retry.
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let outcome: Outcome = { kind: "unknown" };
  try {
    const raw = await Promise.race([
      Promise.resolve().then(() => transport.createShipment({
        submissionKey: claim.attempt.submissionKey, preparation: claim.preparation,
      }, controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(Error("TIMEOUT")); }, Math.max(1, Math.min(timeoutMs, 25_000)));
      }),
    ]);
    const parsed = outcomeSchema.safeParse(raw);
    if (parsed.success) outcome = parsed.data;
  } catch {
    // Do not persist raw carrier errors, credentials or customer data from them.
    outcome = { kind: "unknown" };
  } finally { clearTimeout(timer); }

  const status = outcome.kind === "created" ? "CREATED" : outcome.kind === "rejected" ? "REJECTED" : "UNKNOWN";
  const trackingNumber = outcome.kind === "created" ? outcome.trackingNumber : null;
  const labelUrl = outcome.kind === "created" ? safeLabelUrl(outcome.labelUrl) : null;
  try {
    return await db.$transaction(async tx => {
      await lockOrder(tx, input.orderId);
      const attempt = await tx.bookShipmentAttempt.findUniqueOrThrow({ where: { id: claim.attempt.id } });
      const shipment = await tx.bookShipment.findUniqueOrThrow({ where: { id: attempt.shipmentId } });
      if (attempt.status !== "SUBMITTING" || shipment.status !== "SUBMITTING") throw new SubmissionError("CONFIRMATION_REQUIRED");
      await tx.bookShipmentAttempt.update({ where: { id: attempt.id }, data: {
        status, trackingNumber, labelUrl, finishedAt: new Date(),
        failureCode: outcome.kind === "rejected" ? outcome.code : outcome.kind === "unknown" ? "CONFIRMATION_REQUIRED" : null,
      } });
      return tx.bookShipment.update({ where: { id: shipment.id }, data: {
        status, trackingNumber, labelUrl, bookedAt: status === "CREATED" ? new Date() : null, updatedBy: input.actor,
      } });
    });
  } catch {
    // The carrier may already have booked. Keep the persisted SUBMITTING claim;
    // an operator must reconcile it before any new attempt.
    throw new SubmissionError("RESULT_NOT_SAVED_CONFIRMATION_REQUIRED");
  }
}
