import { z } from "zod";

function randomBytes(size: number) {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(size));
  return {
    toString: (_encoding: "hex") =>
      Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""),
  };
}

export const GOVERNORATES = [
  "AKKAR",
  "NORTH_LEBANON",
  "SOUTH_LEBANON",
  "BEIRUT",
  "MOUNT_LEBANON",
  "NABATIEH",
  "BEKAA",
  "BAALBEK_HERMEL",
] as const;

export const QUANTITY_RANGES = [
  "UNDER_10",
  "FROM_10_TO_25",
  "FROM_26_TO_50",
  "FROM_51_TO_100",
  "OVER_100",
] as const;

export const BOOK_CATEGORIES = [
  "FICTION",
  "CHILDREN",
  "EDUCATIONAL",
  "UNIVERSITY",
  "BUSINESS",
  "SELF_DEVELOPMENT",
  "OTHER",
] as const;

export const BOOK_LANGUAGES = ["ARABIC", "ENGLISH", "FRENCH", "OTHER"] as const;
export const BOOK_CONDITIONS = ["EXCELLENT", "GOOD", "ACCEPTABLE", "MIXED"] as const;
export const HANDOVER_METHODS = ["DROP_OFF", "PICKUP"] as const;
export const BOOK_DONATION_STATUSES = [
  "NEW",
  "NEEDS_FOLLOW_UP",
  "DROP_OFF_EXPECTED",
  "PICKUP_TO_SCHEDULE",
  "SCHEDULED",
  "COLLECTED",
  "RECEIVED",
  "UNDER_REVIEW",
  "ACCEPTED",
  "REJECTED",
  "CLOSED",
] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const bookDonationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(40),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    governorate: z.enum(GOVERNORATES),
    area: z.string().trim().min(2).max(120),
    detailedAddress: optionalText(500),
    estimatedQuantity: z.enum(QUANTITY_RANGES),
    bookCategories: z.array(z.enum(BOOK_CATEGORIES)).min(1).max(BOOK_CATEGORIES.length),
    otherCategory: optionalText(120),
    bookLanguages: z.array(z.enum(BOOK_LANGUAGES)).max(BOOK_LANGUAGES.length).default([]),
    overallCondition: z.enum(BOOK_CONDITIONS),
    handoverMethod: z.enum(HANDOVER_METHODS),
    notes: optionalText(2000),
    locale: z.enum(["en", "ar"]),
    donationConsent: z.literal(true),
    privacyConsent: z.literal(true),
    acceptanceAcknowledged: z.literal(true),
    website: z.string().max(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.handoverMethod === "PICKUP" && !data.detailedAddress?.trim()) {
      ctx.addIssue({ code: "custom", path: ["detailedAddress"], message: "A detailed address is required for pickup." });
    }
    if (data.bookCategories.includes("OTHER") && !data.otherCategory?.trim()) {
      ctx.addIssue({ code: "custom", path: ["otherCategory"], message: "Please describe the other book category." });
    }
  });

export type BookDonationInput = z.infer<typeof bookDonationSchema>;

export function consentTextVersion(locale: "en" | "ar") {
  return `book-donation-v1-2026-09-05-${locale}`;
}

export function generateDonationReference(date = new Date()) {
  const stamp = date.toISOString().slice(2, 10).replaceAll("-", "");
  return `BRD-${stamp}-${randomBytes(3).toString("hex").toUpperCase()}`;
}
