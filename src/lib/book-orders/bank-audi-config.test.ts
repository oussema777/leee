import { describe, expect, it } from "vitest";
import { BANK_AUDI_QR, bankAudiReadiness, bankAudiSnapshot, emptyBankAudiConfig, validLebaneseIban } from "./bank-audi-config";

describe("Bank Audi activation", () => {
  it("keeps the supplied account disabled until beneficiary, QR and transfer terms are checked", () => {
    const config = emptyBankAudiConfig();
    expect(config.enabled).toBe(false);
    expect(config.qrImageUrl).toBe(BANK_AUDI_QR);
    expect(bankAudiReadiness(config).length).toBeGreaterThan(0);
    expect(bankAudiSnapshot(config, 500)).toBeNull();
    Object.assign(config, { enabled: true, accountName: "Verified LEE recipient", qrVerified: true, termsVerified: true });
    expect(bankAudiReadiness(config)).toEqual([]);
    expect(bankAudiSnapshot(config, 900)).toMatchObject({ amountCents: 900, currency: "USD", imageUrl: BANK_AUDI_QR });
  });
  it("checks the IBAN checksum and rejects bank details that differ from the supplied QR", () => {
    const config = { ...emptyBankAudiConfig(), enabled: true, accountName: "Verified LEE recipient", qrVerified: true, termsVerified: true };
    expect(validLebaneseIban(config.iban)).toBe(true);
    expect(validLebaneseIban(config.iban.slice(0, -1) + "3")).toBe(false);
    config.accountNumber = "502310050003";
    expect(bankAudiReadiness(config).some(issue => issue.includes("match the supplied"))).toBe(true);
    expect(bankAudiSnapshot(config, 500)).toBeNull();
  });
});
