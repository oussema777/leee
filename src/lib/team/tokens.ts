import { randomBytes } from "crypto";

/** 32-byte URL-safe random token (base64url, no padding). */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}
