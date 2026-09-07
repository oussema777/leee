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
  "UNIVERSITY",
  "BUSINESS",
  "SELF_DEVELOPMENT",
  "OTHER",
] as const;

export const BOOK_LANGUAGES = ["ARABIC", "ENGLISH", "FRENCH", "OTHER"] as const;
export const BOOK_CONDITIONS = ["EXCELLENT", "GOOD", "ACCEPTABLE"] as const;
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

function isBookCoverUrl(value: string) {
  try {
    const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const url = new URL(value);
    return url.protocol === "https:" && url.host === base.host &&
      url.pathname.startsWith("/storage/v1/object/public/uploads/book-restore/");
  } catch {
    return false;
  }
}

const bookCoverUrl = z.string().url().max(2_000).refine(isBookCoverUrl, "Upload a verified book-cover image.");

export const donatedBookSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: optionalText(160),
  category: z.enum(BOOK_CATEGORIES),
  language: z.enum(BOOK_LANGUAGES),
  condition: z.enum(BOOK_CONDITIONS),
  frontCoverUrl: bookCoverUrl,
  backCoverUrl: bookCoverUrl,
}).strict();

export type DonatedBookInput = z.infer<typeof donatedBookSchema>;

export const bookDonationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(40),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    governorate: z.enum(GOVERNORATES),
    area: z.string().trim().min(2).max(120),
    detailedAddress: optionalText(500),
    books: z.array(donatedBookSchema).min(1).max(25),
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
  });

export type BookDonationInput = z.infer<typeof bookDonationSchema>;

export function consentTextVersion(locale: "en" | "ar") {
  return `book-donation-v2-2026-09-07-${locale}`;
}

export function generateDonationReference(date = new Date()) {
  const stamp = date.toISOString().slice(2, 10).replaceAll("-", "");
  return `BRD-${stamp}-${randomBytes(3).toString("hex").toUpperCase()}`;
}
