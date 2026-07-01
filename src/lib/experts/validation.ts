const ENGAGEMENT = ["Yes", "No"] as const;

export type CleanExpert = {
  fullName: string;
  professionalTitle: string;
  countries: string[];
  phone: string;
  email: string;
  linkedinUrl?: string;
  photoUrl: string;
  photoConsent: boolean;
  degrees: string[];
  degreeDetails: string;
  majorFieldOfStudy: string;
  yearsExperience: string;
  certifications: string;
  licensesMemberships?: string;
  shortBio: string;
  expertiseKeywords: string;
  notableWork?: string;
  languages: string;
  availableForEngagements: string;
  dailyRate: string;
  publishConsent: boolean;
};

type Result =
  | { ok: true; value: CleanExpert }
  | { ok: false; field?: string; error: string };

function supabaseHost(): string | null {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host; } catch { return null; }
}
function isValidUrl(v: string): boolean {
  try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
}
function isEmail(v: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isOwnPhoto(url: string, host: string | null): boolean {
  if (url.startsWith("/")) return true;
  try { return !!host && new URL(url).host === host; } catch { return false; }
}
function cleanArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

export function validateExpertSubmission(
  input: Record<string, unknown>,
  allowedHost: string | null = supabaseHost()
): Result {
  const fail = (field: string, error: string): Result => ({ ok: false, field, error });

  // Required text fields with max length
  const text: Array<[keyof CleanExpert, number]> = [
    ["fullName", 120], ["professionalTitle", 200], ["phone", 40],
    ["majorFieldOfStudy", 200], ["yearsExperience", 40], ["certifications", 5000],
    ["degreeDetails", 5000], ["shortBio", 1000], ["expertiseKeywords", 300],
    ["languages", 300], ["dailyRate", 50],
  ];
  const out: Record<string, unknown> = {};
  for (const [key, max] of text) {
    const v = String(input[key] ?? "").trim();
    if (!v) return fail(key, `${key} is required`);
    if (v.length > max) return fail(key, `${key} is too long`);
    out[key] = v;
  }

  // Email
  const email = String(input.email ?? "").trim();
  if (!email) return fail("email", "Email is required");
  if (email.length > 200 || !isEmail(email)) return fail("email", "Valid email required");
  out.email = email.toLowerCase();

  // Arrays (>=1)
  const countries = cleanArray(input.countries);
  if (countries.length === 0) return fail("countries", "Select at least one country");
  const degrees = cleanArray(input.degrees);
  if (degrees.length === 0) return fail("degrees", "Select at least one degree");
  out.countries = countries;
  out.degrees = degrees;

  // Availability (Yes/No)
  const avail = String(input.availableForEngagements ?? "").trim();
  if (!ENGAGEMENT.includes(avail as any)) return fail("availableForEngagements", "Select Yes or No");
  out.availableForEngagements = avail;

  // Photo (required, own host) + photo consent
  const photoUrl = String(input.photoUrl ?? "").trim();
  if (!photoUrl) return fail("photoUrl", "Photo is required");
  if (photoUrl.length > 500 || !isOwnPhoto(photoUrl, allowedHost)) return fail("photoUrl", "Invalid photo");
  out.photoUrl = photoUrl;
  if (input.photoConsent !== true) return fail("photoConsent", "Photo permission is required");
  out.photoConsent = true;

  // publishConsent: required to be a boolean choice (true or false both valid)
  out.publishConsent = input.publishConsent === true;

  // Optional fields
  for (const [key, max] of [["linkedinUrl", 500], ["licensesMemberships", 5000], ["notableWork", 5000]] as const) {
    const raw = input[key];
    if (raw == null || String(raw).trim() === "") continue;
    const v = String(raw).trim();
    if (v.length > max) return fail(key, `${key} is too long`);
    if (key === "linkedinUrl" && !isValidUrl(v)) return fail("linkedinUrl", "Invalid LinkedIn URL");
    out[key] = v;
  }

  return { ok: true, value: out as CleanExpert };
}
