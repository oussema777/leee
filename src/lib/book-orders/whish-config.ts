import { z } from "zod";

export const WHISH_AMOUNTS = [500, 900, 2500, 5000, 8000] as const;
export const WHISH_QRS = [
  { amountCents: 500, imageUrl: "/payments/whish/usd-5.jpeg", paymentUrl: "https://whish.money/pay/e0vYXCNFW" },
  { amountCents: 900, imageUrl: "/payments/whish/usd-9.jpg", paymentUrl: "https://whish.money/pay/D0UYaCfKs" },
  { amountCents: 2500, imageUrl: "/payments/whish/usd-25.jpg", paymentUrl: "https://whish.money/pay/x0rYcCeVF" },
  { amountCents: 5000, imageUrl: "/payments/whish/usd-50.jpeg", paymentUrl: "https://whish.money/pay/B0fYkCf1I" },
  { amountCents: 8000, imageUrl: "/payments/whish/usd-80.jpeg", paymentUrl: "https://whish.money/pay/90QYYC870" },
] as const;

export const qrSchema = z.object({
  amountCents: z.number().int(),
  verified: z.boolean(),
  reusable: z.boolean(),
  expiryConfirmed: z.boolean(),
  expiresAt: z.string().datetime().nullable(),
});
export const whishConfigSchema = z.object({
  enabled: z.boolean(),
  accountName: z.string().trim().max(120),
  accountNumber: z.string().trim().max(30),
  supportPhone: z.string().trim().max(30),
  holdHours: z.number().int().min(1).max(168),
  qrCodes: z.array(qrSchema).length(5),
}).superRefine((c, ctx) => {
  if (new Set(c.qrCodes.map(q => q.amountCents)).size !== 5 ||
      c.qrCodes.some(q => !WHISH_AMOUNTS.includes(q.amountCents as typeof WHISH_AMOUNTS[number]))) {
    ctx.addIssue({ code: "custom", path: ["qrCodes"], message: "Provide one entry for each of the five amounts." });
  }
});
export type WhishConfig = z.infer<typeof whishConfigSchema>;
export type WhishSnapshot = {
  amountCents: number; currency: "USD"; accountName: string; accountNumber: string;
  supportPhone: string; imageUrl: string; paymentUrl: string; qrExpiresAt: string | null;
};
export function emptyWhishConfig(): WhishConfig {
  return {
    enabled: false, accountName: "", accountNumber: "", supportPhone: "9613600747",
    holdHours: 24,
    qrCodes: WHISH_AMOUNTS.map(amountCents => ({ amountCents, verified: false, reusable: false, expiryConfirmed: false, expiresAt: null })),
  };
}
export function digits(value: string) { return value.replace(/\D/g, ""); }
export function readiness(c: WhishConfig, now = new Date()): string[] {
  const issues: string[] = [];
  if (!c.accountName) issues.push("Enter the receiving account name.");
  if (!/^\d{6,15}$/.test(digits(c.accountNumber))) issues.push("Enter the receiving account number.");
  if (!/^\d{8,15}$/.test(digits(c.supportPhone))) issues.push("Enter the support WhatsApp number with country code.");
  for (const q of c.qrCodes) {
    if (!q.verified || !q.reusable || !q.expiryConfirmed) issues.push("Verify recipient, amount, USD, repeat use and expiry for $" + q.amountCents / 100 + ".");
    if (q.expiresAt && new Date(q.expiresAt) <= now) issues.push("The $" + q.amountCents / 100 + " QR has expired.");
  }
  return issues;
}
export function isWhishAvailable(c: WhishConfig, now = new Date()) {
  return c.enabled && readiness(c, now).length === 0;
}
export function makeSnapshot(c: WhishConfig, amountCents: number): WhishSnapshot | null {
  if (!isWhishAvailable(c)) return null;
  const asset = WHISH_QRS.find(q => q.amountCents === amountCents);
  const setting = c.qrCodes.find(q => q.amountCents === amountCents);
  if (!asset || !setting) return null;
  return { ...asset, currency: "USD", accountName: c.accountName, accountNumber: c.accountNumber, supportPhone: c.supportPhone, qrExpiresAt: setting.expiresAt };
}
export function snapshotActive(c: WhishConfig, s: WhishSnapshot) {
  const latest = makeSnapshot(c, s.amountCents);
  return !!latest && latest.paymentUrl === s.paymentUrl && latest.imageUrl === s.imageUrl &&
    latest.accountName === s.accountName && digits(latest.accountNumber) === digits(s.accountNumber) &&
    (!s.qrExpiresAt || new Date(s.qrExpiresAt).getTime() > Date.now());
}
export function paymentDeadline(c: WhishConfig, s: WhishSnapshot, now = new Date()) {
  return new Date(Math.min(now.getTime() + c.holdHours * 3600000, s.qrExpiresAt ? new Date(s.qrExpiresAt).getTime() : Infinity));
}
