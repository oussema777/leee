import { z } from "zod";
export const accessTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const paymentReportSchema = z.object({
  transactionReference: z.string().trim().max(100)
    .refine(value => value === "" || (value.length >= 3 && /^[A-Za-z0-9 _./:-]+$/.test(value)), "Enter a valid Whish reference or leave it blank."),
  senderPhone: z.string().trim().min(6).max(30).regex(/^[+\d\s().-]+$/)
    .refine(value => /^\d{6,15}$/.test(value.replace(/\D/g, "")), "Enter the phone number used to pay."),
});
export const paymentReviewSchema = z.object({
  action: z.enum(["VERIFY", "REQUEST_CORRECTION", "REFUND"]),
  expectedUpdatedAt: z.string().datetime(),
  transactionReference: z.string().trim().max(100).optional(),
  receivedAmountCents: z.number().int().positive().optional(),
  currency: z.literal("USD").optional(),
  checkedWallet: z.boolean().optional(),
  note: z.string().trim().max(500).default(""),
});
export type WhishState = "AWAITING_PAYMENT" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "VERIFIED" | "EXPIRED" | "CANCELLED" | "REFUNDED";
export function normalizedReference(value: string) { return value.trim().toUpperCase().replace(/\s+/g, ""); }
export function shouldExpire(state: WhishState, expiresAt: Date, now = new Date()) {
  return (state === "AWAITING_PAYMENT" || state === "CHANGES_REQUESTED") && expiresAt <= now;
}
export function canReportPayment(state: WhishState) { return !["VERIFIED", "REFUNDED"].includes(state); }
export function canFulfilWhish(state: WhishState | undefined, paymentStatus: string) {
  return state === "VERIFIED" && paymentStatus === "PAID";
}
export function reviewProblem(input: z.infer<typeof paymentReviewSchema>, state: WhishState, amountCents: number): string | null {
  if (input.action === "VERIFY") {
    if (state !== "UNDER_REVIEW") return "This payment must be awaiting review.";
    if (!input.checkedWallet) return "Confirm that you checked the receiving wallet.";
    if (!input.transactionReference || !paymentReportSchema.shape.transactionReference.safeParse(input.transactionReference).success) return "Enter the actual wallet transaction reference.";
    if (input.receivedAmountCents !== amountCents || input.currency !== "USD") return "The received amount and USD currency must exactly match the order.";
  } else if (input.action === "REQUEST_CORRECTION") {
    if (state !== "UNDER_REVIEW") return "Only a payment awaiting review can be returned for correction.";
    if (!input.note) return "Explain what the customer needs to correct.";
  } else {
    if (state !== "VERIFIED") return "Only a verified payment can be recorded as refunded.";
    if (!input.checkedWallet || !input.note) return "Confirm the refund was completed outside the website and record its reference.";
  }
  return null;
}
