import { describe, it, expect } from "vitest";
import { validateExpertSubmission } from "./validation";

const HOST = "wqphvlzndbwqgcojipvn.supabase.co";
const photo = `https://${HOST}/storage/v1/object/public/uploads/x.jpg`;

const base = {
  fullName: "Dr. Sara Smith",
  professionalTitle: "Senior Data Scientist",
  countries: ["United States"],
  phone: "+1 555 1234",
  email: "sara@example.com",
  photoUrl: photo,
  photoConsent: true,
  degrees: ["Doctorate (PhD, EdD, DBA, DSc,etc.)"],
  degreeDetails: "PhD in CS, MIT, 2014",
  majorFieldOfStudy: "Computer Science",
  yearsExperience: "11-15 years",
  certifications: "AWS Certified Solutions Architect",
  shortBio: "12 years in AI. Led two FDA models. Advises biotech startups.",
  expertiseKeywords: "AI, oncology, ML",
  languages: "English, Arabic",
  availableForEngagements: "Yes",
  dailyRate: "200 USD",
  publishConsent: true,
};

describe("validateExpertSubmission", () => {
  it("accepts a complete valid submission", () => {
    const r = validateExpertSubmission(base, HOST);
    expect(r.ok).toBe(true);
  });
  it("rejects each missing required field with that field name", () => {
    for (const key of ["fullName", "professionalTitle", "phone", "email", "degreeDetails", "majorFieldOfStudy", "yearsExperience", "certifications", "shortBio", "expertiseKeywords", "languages", "availableForEngagements", "dailyRate"]) {
      const r = validateExpertSubmission({ ...base, [key]: "  " }, HOST);
      expect(r.ok, key).toBe(false);
      if (!r.ok) expect(r.field).toBe(key);
    }
  });
  it("rejects empty countries / degrees arrays", () => {
    expect(validateExpertSubmission({ ...base, countries: [] }, HOST).ok).toBe(false);
    expect(validateExpertSubmission({ ...base, degrees: [] }, HOST).ok).toBe(false);
  });
  it("requires photoUrl + photoConsent true", () => {
    expect(validateExpertSubmission({ ...base, photoUrl: "" }, HOST).ok).toBe(false);
    expect(validateExpertSubmission({ ...base, photoConsent: false }, HOST).ok).toBe(false);
  });
  it("accepts a submission that declines publishing (publishConsent false is valid)", () => {
    const r = validateExpertSubmission({ ...base, publishConsent: false }, HOST);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.publishConsent).toBe(false);
  });
  it("rejects bad email and bad linkedin URL", () => {
    expect(validateExpertSubmission({ ...base, email: "nope" }, HOST).ok).toBe(false);
    expect(validateExpertSubmission({ ...base, linkedinUrl: "not a url" }, HOST).ok).toBe(false);
  });
  it("rejects non-http(s) URL schemes for linkedinUrl (XSS guard)", () => {
    expect(validateExpertSubmission({ ...base, linkedinUrl: "javascript:alert(1)" }, HOST).ok).toBe(false);
    expect(validateExpertSubmission({ ...base, linkedinUrl: "data:text/html,x" }, HOST).ok).toBe(false);
  });
  it("rejects a photoUrl outside our host", () => {
    expect(validateExpertSubmission({ ...base, photoUrl: "https://evil.com/x.jpg" }, HOST).ok).toBe(false);
  });
  it("rejects over-length fields", () => {
    expect(validateExpertSubmission({ ...base, fullName: "x".repeat(121) }, HOST).ok).toBe(false);
    expect(validateExpertSubmission({ ...base, shortBio: "x".repeat(1001) }, HOST).ok).toBe(false);
  });
  it("accepts and passes through optional fields; ignores unknown", () => {
    const r = validateExpertSubmission({ ...base, linkedinUrl: "https://linkedin.com/in/sara", notableWork: "Paper X", evil: "y" }, HOST);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.linkedinUrl).toBe("https://linkedin.com/in/sara");
      expect((r.value as any).evil).toBeUndefined();
    }
  });
});
