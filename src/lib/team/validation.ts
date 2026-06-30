const LOCALES = ["en", "ar"] as const;

export type CleanSubmission = {
  name: string;
  title: string;
  locale: "en" | "ar";
  photoUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
};

type Result =
  | { ok: true; value: CleanSubmission }
  | { ok: false; error: string };

function isValidUrl(v: string): boolean {
  try { new URL(v); return true; } catch { return false; }
}

function supabaseHost(): string | null {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host; }
  catch { return null; }
}

/** Photo must be a relative path on our site, or hosted on our supabase bucket. */
function isOwnPhoto(url: string, allowedHost: string | null): boolean {
  if (url.startsWith("/")) return true;
  try { return !!allowedHost && new URL(url).host === allowedHost; }
  catch { return false; }
}

export function validateSubmission(
  input: Record<string, unknown>,
  allowedHost: string | null = supabaseHost()
): Result {
  const name = String(input.name ?? "").trim();
  const title = String(input.title ?? "").trim();
  const locale = String(input.locale ?? "");
  if (!name) return { ok: false, error: "Name is required" };
  if (name.length > 120) return { ok: false, error: "Name is too long" };
  if (!title) return { ok: false, error: "Role/title is required" };
  if (title.length > 200) return { ok: false, error: "Role/title is too long" };
  if (!LOCALES.includes(locale as any)) return { ok: false, error: "Invalid locale" };

  const socials: Record<string, string | undefined> = {};
  for (const key of ["linkedinUrl", "twitterUrl", "instagramUrl", "websiteUrl"] as const) {
    const raw = input[key];
    if (raw == null || raw === "") continue;
    const s = String(raw).trim();
    if (s.length > 500 || !isValidUrl(s)) return { ok: false, error: `Invalid ${key}` };
    socials[key] = s;
  }

  let photoUrl: string | undefined;
  if (input.photoUrl != null && input.photoUrl !== "") {
    const p = String(input.photoUrl).trim();
    if (p.length > 500 || !isOwnPhoto(p, allowedHost)) return { ok: false, error: "Invalid photo URL" };
    photoUrl = p;
  }

  return {
    ok: true,
    value: { name, title, locale: locale as "en" | "ar", photoUrl, ...socials },
  };
}
