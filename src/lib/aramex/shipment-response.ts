import { z } from "zod";
import { safeLabelUrl } from "./submission-status";

// Supplied shipping manual Table 10 and Table 12 / Fig.23.
// Correlation is mandatory here; missing/mismatched evidence is never retryable.
const notification = z.object({ Code: z.string().min(1), Message: z.string() });
const responseSchema = z.object({
  HasErrors: z.boolean(),
  Transaction: z.object({ Reference1: z.string() }),
  Shipments: z.array(z.object({
    ID: z.string().nullable().optional(), Reference1: z.string(), Reference2: z.string(),
    HasErrors: z.boolean(), Notifications: z.array(notification).nullish(),
    ShipmentLabel: z.unknown().optional(),
  })).length(1),
});
export type ShipmentOutcome =
  | { kind: "created"; trackingNumber: string; labelUrl: string | null }
  | { kind: "rejected"; code: "VALIDATION" }
  | { kind: "unknown" };

export function parseShipmentResponse(raw: unknown, expected: { submissionKey: string; orderReference: string }): ShipmentOutcome {
  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success) return { kind: "unknown" };
  const response = parsed.data;
  const shipment = response.Shipments[0];
  if (response.Transaction.Reference1 !== expected.submissionKey || shipment.Reference2 !== expected.submissionKey
    || shipment.Reference1 !== expected.orderReference) return { kind: "unknown" };
  if (!shipment.HasErrors && typeof shipment.ID === "string" && /^[A-Za-z0-9-]{5,50}$/.test(shipment.ID)) {
    // A missing/bad label or a top-level notification must not lose an explicit
    // successful AWB or cause another booking. Label retrieval is separate work.
    const label = z.object({ LabelURL: z.unknown().optional() }).safeParse(shipment.ShipmentLabel);
    return { kind: "created", trackingNumber: shipment.ID, labelUrl: safeLabelUrl(label.success ? label.data.LabelURL : null) };
  }
  if (response.HasErrors && shipment.HasErrors && (shipment.ID === "" || shipment.ID === null)
    && shipment.Notifications?.length) return { kind: "rejected", code: "VALIDATION" };
  // Generic errors, no shipment row, or an ID accompanying an error require
  // reconciliation. Do not classify by matching human-readable error messages.
  return { kind: "unknown" };
}
