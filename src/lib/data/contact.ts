import { db } from "@/lib/db";

/**
 * ContactInfo is a key/value store managed by the admin Settings → Contact tab.
 * Keys used here MUST match the admin tab (src/app/admin/(dashboard)/settings/components/ContactInfoTab.tsx):
 *   email, phone, address, whatsapp, mapUrl, facebook, instagram, twitter, linkedin, youtube
 *
 * Each entry has an English value (valueEn) and an optional Arabic value (valueAr).
 */

export type ContactValue = { en: string; ar: string };

/** Map of contact key → { en, ar }. AR falls back to EN when valueAr is missing. */
export type ContactInfoMap = Record<string, ContactValue>;

export async function getContactInfo(): Promise<ContactInfoMap> {
  try {
    const rows = await db.contactInfo.findMany();
    const map: ContactInfoMap = {};
    for (const row of rows) {
      map[row.key] = { en: row.valueEn, ar: row.valueAr ?? row.valueEn };
    }
    return map;
  } catch {
    // DB unavailable — return empty map so consumers fall back to hardcoded defaults.
    return {};
  }
}

/**
 * Read a contact value for the given locale from the map, falling back to a
 * hardcoded default if the key is missing (so the site never shows blank info).
 */
export function contactValue(
  map: ContactInfoMap | undefined,
  key: string,
  locale: string,
  fallback: string
): string {
  const entry = map?.[key];
  if (!entry) return fallback;
  const val = locale === "ar" ? entry.ar : entry.en;
  return val && val.trim() ? val : fallback;
}
