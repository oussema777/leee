import { db } from "@/lib/db";
import { generateInviteToken } from "./tokens";

const SINGLETON_ID = "singleton";

/** Returns the active link, creating it lazily on first call. */
export async function getOrCreateInviteLink() {
  return db.teamInviteLink.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID, token: generateInviteToken() },
  });
}

/** Overwrites the token, invalidating any previously shared link. */
export async function regenerateInviteLink() {
  return db.teamInviteLink.upsert({
    where: { id: SINGLETON_ID },
    update: { token: generateInviteToken() },
    create: { id: SINGLETON_ID, token: generateInviteToken() },
  });
}

/** True if the provided token matches the single active link. */
export async function isValidInviteToken(token: string): Promise<boolean> {
  if (!token) return false;
  const row = await db.teamInviteLink.findUnique({ where: { id: SINGLETON_ID } });
  return !!row && row.token === token;
}

export function buildInviteUrl(locale: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${base}/${locale}/join-team/${token}`;
}
