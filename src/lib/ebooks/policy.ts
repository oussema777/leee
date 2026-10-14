import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const catalogSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  titleEn: z.string().trim().min(1).max(200),
  titleAr: z.string().trim().max(200).default(""),
  author: z.string().trim().min(1).max(150),
  descriptionEn: z.string().trim().max(10000).default(""),
  descriptionAr: z.string().trim().max(10000).default(""),
  coverUrl: z
    .string()
    .max(2000)
    .refine(
      (v) => !v || /^\/(?!\/)/.test(v) || /^https:\/\//.test(v),
      "Use a site path or HTTPS image URL",
    )
    .default(""),
  priceCents: z.number().int().min(100).max(1000000),
  direction: z.enum(["rtl", "ltr"]).default("rtl"),
  language: z.enum(["ARABIC", "ENGLISH", "FRENCH", "OTHER"]).default("ARABIC"),
  categories: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  published: z.boolean().default(false),
});
export const checkoutSchema = z.object({
  ebookId: z.string().min(1).max(100),
  customerName: z.string().trim().min(2).max(120),
  method: z.enum(["WHISH", "BANK_AUDI"]),
  locale: z.enum(["en", "ar"]),
  termsAccepted: z.literal(true),
});
export const reviewSchema = z.object({
  action: z.enum([
    "VERIFY",
    "REQUEST_CORRECTION",
    "REFUND",
    "REVOKE",
    "RESTORE",
    "RESEND",
  ]),
  expectedUpdatedAt: z.string().datetime(),
  note: z.string().trim().max(1000).default(""),
  transactionReference: z.string().trim().min(3).max(100).optional(),
  receivedAmountCents: z.number().int().positive().optional(),
  currency: z.literal("USD").optional(),
  checkedWallet: z.boolean().optional(),
});
export function reviewError(
  input: z.infer<typeof reviewSchema>,
  state: string,
  amount: number,
  active?: boolean,
) {
  switch (input.action) {
    case "VERIFY":
      if (state !== "UNDER_REVIEW")
        return "Only a submitted payment can be verified.";
      if (!input.checkedWallet || !input.transactionReference)
        return "Check the receiving account and enter its transaction reference.";
      if (input.receivedAmountCents !== amount || input.currency !== "USD")
        return "The received USD amount must match the order exactly.";
      break;
    case "REQUEST_CORRECTION":
      if (state !== "UNDER_REVIEW" || !input.note)
        return "A payment awaiting review and a correction message are required.";
      break;
    case "REFUND":
      if (state !== "VERIFIED" || !input.checkedWallet || !input.note)
        return "Confirm the external refund and record its reference before revoking access.";
      break;
    case "REVOKE":
    case "RESTORE":
      if (state !== "VERIFIED" || !input.note)
        return "Only paid access can be changed; a reason is required.";
      if (input.action === "RESTORE" && active)
        return "Access is already active.";
      if (input.action === "REVOKE" && !active)
        return "Access is already revoked.";
      break;
    case "RESEND":
      if (state !== "VERIFIED" || !active)
        return "Only active, paid access can receive a reading invitation.";
  }
  return null;
}
export function canRead(
  access: { active: boolean; order: { state: string } } | null,
) {
  return !!access && access.active && access.order.state === "VERIFIED";
}
export function validPage(number: number, count: number) {
  return Number.isInteger(number) && number >= 1 && number <= count;
}
