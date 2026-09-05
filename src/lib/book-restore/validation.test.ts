import { describe, expect, it } from "vitest";
import { bookDonationSchema, consentTextVersion, generateDonationReference } from "./validation";

const validSubmission = {
  fullName: "Maya Haddad",
  phone: "+961 70 123 456",
  email: "maya@example.com",
  governorate: "SOUTH_LEBANON" as const,
  area: "Saida",
  detailedAddress: "",
  estimatedQuantity: "FROM_10_TO_25" as const,
  bookCategories: ["FICTION", "CHILDREN"],
  otherCategory: "",
  bookLanguages: ["ARABIC", "ENGLISH"],
  overallCondition: "GOOD" as const,
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
    expect(bookDonationSchema.safeParse(validSubmission).success).toBe(true);
  });

  it("accepts Arabic donor content", () => {
    expect(bookDonationSchema.safeParse({ ...validSubmission, fullName: "مايا حداد", area: "صيدا", locale: "ar" }).success).toBe(true);
  });

  it("requires a detailed address for pickup", () => {
    const result = bookDonationSchema.safeParse({ ...validSubmission, handoverMethod: "PICKUP" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.detailedAddress).toBeDefined();
  });

  it("requires a description when Other is selected", () => {
    const result = bookDonationSchema.safeParse({ ...validSubmission, bookCategories: ["OTHER"] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.otherCategory).toBeDefined();
  });

  it("requires all three acknowledgements", () => {
    for (const key of ["donationConsent", "privacyConsent", "acceptanceAcknowledged"] as const) {
      expect(bookDonationSchema.safeParse({ ...validSubmission, [key]: false }).success).toBe(false);
    }
  });

  it("enforces array limits and rejects honeypot content", () => {
    expect(bookDonationSchema.safeParse({ ...validSubmission, bookLanguages: ["ARABIC", "ENGLISH", "FRENCH", "OTHER", "ARABIC"] }).success).toBe(false);
    expect(bookDonationSchema.safeParse({ ...validSubmission, website: "https://spam.example" }).success).toBe(false);
  });
});

describe("book donation metadata", () => {
  it("creates a human-readable reference", () => {
    expect(generateDonationReference(new Date("2026-09-05T12:00:00Z"))).toMatch(/^BRD-260905-[A-F0-9]{6}$/);
  });

  it("versions consent by locale", () => {
    expect(consentTextVersion("ar")).toBe("book-donation-v1-2026-09-05-ar");
  });
});
