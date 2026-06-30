type CsvRow = Record<string, unknown>;

const COLUMNS: string[] = [
  "createdAt", "status", "adminNotes", "fullName", "professionalTitle", "countries", "phone", "email",
  "linkedinUrl", "degrees", "degreeDetails", "majorFieldOfStudy", "yearsExperience",
  "certifications", "licensesMemberships", "shortBio", "expertiseKeywords", "notableWork",
  "languages", "availableForEngagements", "dailyRate", "photoConsent", "publishConsent",
  "photoUrl",
];

function cell(value: unknown): string {
  let s: string;
  if (value == null) s = "";
  else if (Array.isArray(value)) s = value.join("; ");
  else if (value instanceof Date) s = value.toISOString();
  else s = String(value);
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildExpertCsv(rows: CsvRow[]): string {
  const header = COLUMNS.join(",");
  const body = rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(",")).join("\n");
  return body ? `${header}\n${body}` : header;
}
