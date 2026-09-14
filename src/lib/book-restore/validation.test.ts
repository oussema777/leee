import { describe, expect, it } from "vitest";
import { bookDonationSchema, consentTextVersion, generateDonationReference } from "./validation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
const coverUrl = `${supabaseUrl}/storage/v1/object/public/uploads/book-restore/cover.jpg`;

const validSubmission = {
  fullName: "Maya Haddad",
  phone: "+961 70 123 456",
  email: "maya@example.com",
  governorate: "SOUTH_LEBANON" as const,
  area: "Saida",
  detailedAddress: "",
  books: [{
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    category: "FICTION" as const,
    language: "ENGLISH" as const,
    condition: "GOOD" as const,
    frontCoverUrl: coverUrl,
    backCoverUrl: coverUrl,
  }],
  handoverMethod: "DROP_OFF" as const,
  notes: "Please contact me on WhatsApp.",
  locale: "en" as const,
  donationConsent: true as const,
  privacyConsent: true as const,
  acceptanceAcknowledged: true as const,
  website: "",
};

describe("bookDonationSchema", () => {
  it("accepts a valid English drop-off submission", () => {
    const result = bookDonationSchema.safeParse(validSubmission);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ donorType: "INDIVIDUAL", publicRecognition: false });
  });

  it("accepts an organisation and requires its name", () => {
    expect(bookDonationSchema.safeParse({ ...validSubmission, donorType: "ORGANISATION", organizationName: "LEE Foundation", publicRecognition: true }).success).toBe(true);
    const missingName = bookDonationSchema.safeParse({ ...validSubmission, donorType: "ORGANISATION" });
    expect(missingName.success).toBe(false);
    if (!missingName.success) expect(missingName.error.flatten().fieldErrors.organizationName).toBeDefined();
  });

  it("accepts Arabic donor content", () => {
    expect(bookDonationSchema.safeParse({ ...validSubmission, fullName: "مايا حداد", area: "صيدا", locale: "ar" }).success).toBe(true);
  });

  it("requires a detailed address for pickup", () => {
    const result = bookDonationSchema.safeParse({ ...validSubmission, handoverMethod: "PICKUP" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.detailedAddress).toBeDefined();
  });

  it("requires complete details and both verified covers for every book", () => {
    const result = bookDonationSchema.safeParse({
      ...validSubmission,
      books: [{ ...validSubmission.books[0], backCoverUrl: "" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.books).toBeDefined();
  });

  it("rejects cover URLs outside the Book Restore uploads folder", () => {
    const result = bookDonationSchema.safeParse({
      ...validSubmission,
      books: [{ ...validSubmission.books[0], frontCoverUrl: "https://example.com/cover.jpg" }],
    });
    expect(result.success).toBe(false);
  });

  it("does not accept School & Educational for new donations", () => {
    const result = bookDonationSchema.safeParse({
      ...validSubmission,
      books: [{ ...validSubmission.books[0], category: "EDUCATIONAL" }],
    });
    expect(result.success).toBe(false);
  });

  it("requires all three acknowledgements", () => {
    for (const key of ["donationConsent", "privacyConsent", "acceptanceAcknowledged"] as const) {
      expect(bookDonationSchema.safeParse({ ...validSubmission, [key]: false }).success).toBe(false);
    }
  });

  it("enforces book limits and rejects honeypot content", () => {
    expect(bookDonationSchema.safeParse({ ...validSubmission, books: Array.from({ length: 26 }, () => validSubmission.books[0]) }).success).toBe(false);
    expect(bookDonationSchema.safeParse({ ...validSubmission, website: "https://spam.example" }).success).toBe(false);
  });
});

describe("book donation metadata", () => {
  it("creates a human-readable reference", () => {
    expect(generateDonationReference(new Date("2026-09-05T12:00:00Z"))).toMatch(/^BRD-260905-[A-F0-9]{6}$/);
  });

  it("versions consent by locale", () => {
    expect(consentTextVersion("ar")).toBe("book-donation-v2-2026-09-07-ar");
  });
});
