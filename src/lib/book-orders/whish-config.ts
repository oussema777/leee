import { z } from "zod";

export const WHISH_AMOUNTS = [500, 900, 2500, 5000, 8000] as const;

export const whishConfigSchema = z.object({
  enabled: z.boolean(),
  accountName: z.string().trim().max(120),
  accountNumber: z.string().trim().max(30),
  supportPhone: z.string().trim().max(30),
  holdHours: z.number().int().min(1).max(168),
  qrImageUrl: z.string().trim().max(2048),
  qrVerified: z.boolean(),
});
export type WhishConfig = z.infer<typeof whishConfigSchema>;
export type WhishSnapshot = {
  amountCents: number; currency: "USD"; accountName: string; accountNumber: string;
  supportPhone: string; imageUrl: string;
};

export function emptyWhishConfig(): WhishConfig {
  return {
    enabled: false, accountName: "", accountNumber: "", supportPhone: "9613600747",
    holdHours: 24, qrImageUrl: "", qrVerified: false,
  };
}

/** Preserve saved receiver details while retiring the old five-QR configuration. */
export function parseWhishConfig(value: unknown): WhishConfig {
  const current = whishConfigSchema.safeParse(value);
  if (current.success) return current.data;
  const legacy = z.object({
    accountName: z.string().default(""), accountNumber: z.string().default(""),
    supportPhone: z.string().default("9613600747"), holdHours: z.number().int().min(1).max(168).default(24),
  }).safeParse(value);
  return legacy.success ? { ...legacy.data, enabled: false, qrImageUrl: "", qrVerified: false } : emptyWhishConfig();
}

export function digits(value: string) { return value.replace(/\D/g, ""); }
export function readiness(c: WhishConfig): string[] {
  const issues: string[] = [];
  if (!c.accountName) issues.push("Enter the receiving account name.");
  if (!/^\d{6,15}$/.test(digits(c.accountNumber))) issues.push("Enter the receiving account number.");
  if (!/^\d{8,15}$/.test(digits(c.supportPhone))) issues.push("Enter the support WhatsApp number with country code.");
  if (!c.qrImageUrl) issues.push("Upload the permanent Whish QR code.");
  if (c.qrImageUrl && !c.qrVerified) issues.push("Verify that the QR opens the correct recipient and lets the customer enter the amount.");
  return issues;
}
export function isWhishAvailable(c: WhishConfig) { return c.enabled && readiness(c).length === 0; }
export function makeSnapshot(c: WhishConfig, amountCents: number): WhishSnapshot | null {
  if (!isWhishAvailable(c) || !Number.isInteger(amountCents) || amountCents <= 0) return null;
  return { amountCents, currency: "USD", accountName: c.accountName, accountNumber: c.accountNumber, supportPhone: c.supportPhone, imageUrl: c.qrImageUrl };
}
export function snapshotActive(c: WhishConfig, s: WhishSnapshot) {
  const latest = makeSnapshot(c, s.amountCents);
  return !!latest && latest.imageUrl === s.imageUrl && latest.accountName === s.accountName &&
    digits(latest.accountNumber) === digits(s.accountNumber);
}
export function paymentDeadline(c: WhishConfig, _s: WhishSnapshot, now = new Date()) {
  return new Date(now.getTime() + c.holdHours * 3600000);
}
