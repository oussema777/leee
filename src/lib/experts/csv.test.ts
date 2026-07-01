import { describe, it, expect } from "vitest";
import { buildExpertCsv } from "./csv";

const row = {
  fullName: "Sara, Smith", professionalTitle: 'Lead "AI"', countries: ["US", "UK"],
  phone: "1", email: "s@x.com", linkedinUrl: null, degrees: ["PhD"],
  degreeDetails: "line1\nline2", majorFieldOfStudy: "CS", yearsExperience: "11-15 years",
  certifications: "AWS", licensesMemberships: null, shortBio: "bio", expertiseKeywords: "AI",
  notableWork: null, languages: "EN", availableForEngagements: "Yes", dailyRate: "200 USD",
  photoUrl: "https://x/y.jpg", photoConsent: true, publishConsent: false,
  status: "NEW", createdAt: new Date("2026-06-30T00:00:00Z"),
};

describe("buildExpertCsv", () => {
  it("emits a header + one row, escaping commas/quotes/newlines and joining arrays", () => {
    const csv = buildExpertCsv([row as any]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("fullName");
    expect(csv).toContain('"Sara, Smith"');       // comma escaped
    expect(csv).toContain('"Lead ""AI"""');         // quotes doubled
    expect(csv).toContain("US; UK");                // array joined
    expect(csv).toContain('"line1\nline2"');        // newline preserved inside quotes
  });
  it("handles empty list (header only)", () => {
    expect(buildExpertCsv([]).split("\n")[0]).toContain("email");
  });
  it("neutralizes spreadsheet formula injection", () => {
    const evil = { ...row, fullName: "=HYPERLINK(1)", expertiseKeywords: "@SUM(1)" } as any;
    const csv = buildExpertCsv([evil]);
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain("'@SUM(1)");
  });
});
