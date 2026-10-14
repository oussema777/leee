import { getWhishConfig, getBankAudiConfig } from "@/lib/book-orders/whish-server";

// Temporary, process-local permission to exercise the existing QR flow.
// Never changes the shared receiving-account configuration or its verification record.
export function ebookPaymentTestActive(now = Date.now()) {
  if (process.env.NODE_ENV !== "development") return false;
  try {
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
    const until = Date.parse(process.env.EBOOK_PAYMENT_TEST_UNTIL || "");
    return ["localhost", "127.0.0.1", "[::1]"].includes(site.hostname) && Number.isFinite(until) && until > now;
  } catch { return false; }
}
export async function ebookPaymentSettings() {
  const [whish, bank] = await Promise.all([getWhishConfig(), getBankAudiConfig()]);
  const testMode = ebookPaymentTestActive();
  return {
    // These copies bypass the QR gate only during the explicitly enabled local test.
    // Normal account/IBAN/amount validation and manual payment approval still apply.
    whish: testMode ? { ...whish, enabled: true, qrVerified: true } : whish,
    bank: testMode ? { ...bank, enabled: true, qrVerified: true } : bank,
    testMode,
    testUntil: testMode ? process.env.EBOOK_PAYMENT_TEST_UNTIL : null,
  };
}
