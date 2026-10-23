import { z } from "zod";

export const BANK_AUDI_QR = "/payments/bank-audi/20260928.jpeg";
// Decoded from the supplied, versioned QR asset. A replacement needs new constants and a new asset path.
export const BANK_AUDI_QR_ACCOUNT = "502310050002";
export const BANK_AUDI_QR_IBAN = "LB47005699840153502310050002";
export const bankAudiConfigSchema = z.object({
  enabled: z.boolean(), accountName: z.string().trim().max(120),
  accountNumber: z.string().trim().max(30), iban: z.string().trim().max(34),
  supportPhone: z.string().trim().max(30), holdHours: z.number().int().min(1).max(168),
  qrImageUrl: z.string().trim().max(2048), qrVerified: z.boolean(), termsVerified: z.boolean(),
});
export type BankAudiConfig = z.infer<typeof bankAudiConfigSchema>;
export type BankAudiSnapshot = {
  amountCents: number; currency: "USD"; accountName: string; accountNumber: string;
  iban: string; supportPhone: string; imageUrl: string;
};
export function emptyBankAudiConfig(): BankAudiConfig {
  return { enabled: false, accountName: "", accountNumber: BANK_AUDI_QR_ACCOUNT, iban: BANK_AUDI_QR_IBAN, supportPhone: "9613600747",
    holdHours: 24, qrImageUrl: BANK_AUDI_QR, qrVerified: false, termsVerified: false };
}
export function parseBankAudiConfig(value: unknown): BankAudiConfig {
  return bankAudiConfigSchema.safeParse(value).data || emptyBankAudiConfig();
}
export function validLebaneseIban(value: string) {
  const iban = value.replace(/\s/g, "").toUpperCase();
  if (!/^LB\d{26}$/.test(iban)) return false;
  const rotated = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rotated) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}
export function bankAudiReadiness(config: BankAudiConfig) {
  const issues: string[] = [];
  if (!config.accountName) issues.push("Enter the bank's exact beneficiary name.");
  if (!/^\d{6,20}$/.test(config.accountNumber.replace(/\s/g, ""))) issues.push("Enter the verified bank account number.");
  if (!validLebaneseIban(config.iban)) issues.push("Enter a valid Lebanese IBAN.");
  if (config.accountNumber.replace(/\s/g, "") !== BANK_AUDI_QR_ACCOUNT || config.iban.replace(/\s/g, "").toUpperCase() !== BANK_AUDI_QR_IBAN || config.qrImageUrl !== BANK_AUDI_QR) issues.push("The account details must match the supplied versioned QR. Replace the QR through a reviewed code change.");
  if (!/^\d{8,15}$/.test(config.supportPhone.replace(/\D/g, ""))) issues.push("Enter a support phone number.");
  if (!config.qrImageUrl) issues.push("Provide the Bank Audi QR image.");
  if (!config.qrVerified) issues.push("Verify the QR and bank details with the account owner.");
  if (!config.termsVerified) issues.push("Confirm USD eligibility, fees and transfer terms.");
  return issues;
}
// Historical transfer snapshots remain readable, but cannot start new payments.
// Card checkout has its own configuration and verification lifecycle.
export function isBankAudiAvailable(_config: BankAudiConfig) { return false; }
export function bankAudiSnapshot(config: BankAudiConfig, amountCents: number): BankAudiSnapshot | null {
  if (!isBankAudiAvailable(config) || !Number.isInteger(amountCents) || amountCents <= 0) return null;
  return { amountCents, currency: "USD", accountName: config.accountName, accountNumber: config.accountNumber,
    iban: config.iban.replace(/\s/g, "").toUpperCase(), supportPhone: config.supportPhone, imageUrl: config.qrImageUrl };
}
export function bankAudiSnapshotActive(config: BankAudiConfig, snapshot: BankAudiSnapshot) {
  const current = bankAudiSnapshot(config, snapshot.amountCents);
  return !!current && current.accountName === snapshot.accountName && current.accountNumber === snapshot.accountNumber &&
    current.iban === snapshot.iban && current.imageUrl === snapshot.imageUrl;
}
