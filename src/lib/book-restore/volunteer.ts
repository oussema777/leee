import { z } from "zod";
import { GOVERNORATES } from "./validation";

export const BOOK_VOLUNTEER_INTERESTS = ["COLLECTION", "ORDER_PREPARATION", "STREET_INTERVIEWS", "VIDEO_CONTENT", "COMMUNITY_OUTREACH", "OTHER"] as const;
export const BOOK_VOLUNTEER_AVAILABILITY = ["WEEKDAYS", "WEEKENDS", "FLEXIBLE"] as const;
export const BOOK_VOLUNTEER_STATUSES = ["NEW", "CONTACTED", "ONBOARDED", "DECLINED"] as const;
const optionalText = (limit: number) => z.string().trim().max(limit).optional().or(z.literal(""));

export const bookVolunteerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30).regex(/^[+\d\s().-]+$/),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  governorate: z.enum(GOVERNORATES),
  area: z.string().trim().min(2).max(120),
  interests: z.array(z.enum(BOOK_VOLUNTEER_INTERESTS)).min(1).max(6)
    .refine(items => new Set(items).size === items.length, "Choose each activity once."),
  otherInterest: optionalText(120),
  availability: z.enum(BOOK_VOLUNTEER_AVAILABILITY),
  experience: optionalText(1000),
  notes: optionalText(1000),
  locale: z.enum(["en", "ar"]),
  privacyConsent: z.literal(true),
  website: z.string().max(0).optional(),
}).strict().superRefine((value, context) => {
  if (value.interests.includes("OTHER") && !value.otherInterest?.trim()) context.addIssue({ code: "custom", path: ["otherInterest"], message: "Describe the other activity." });
});
export type BookVolunteerInput = z.infer<typeof bookVolunteerSchema>;
export function volunteerReference(date = new Date()) {
  return `BRV-${date.toISOString().slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}
export function volunteerConsentVersion(locale: "en" | "ar") { return `book-volunteer-v1-2026-09-28-${locale}`; }
