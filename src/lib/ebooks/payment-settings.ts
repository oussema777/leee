import { getWhishConfig, getBankAudiConfig } from "@/lib/book-orders/whish-server";
import { db } from "@/lib/db";

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
  const [whish, bank, management] = await Promise.all([
    getWhishConfig(), getBankAudiConfig(),
    db.bookWhishSettings.findUnique({ where: { id: "ebook-management-testing" }, select: { config: true } }),
  ]);
  // Explicitly authorized hosted management testing; independent of printed books.
  const managementTesting = (management?.config as { enabled?: unknown } | null)?.enabled === true;
  const testMode = managementTesting || ebookPaymentTestActive();
  return {
    // Copies enable the saved QRs for explicitly enabled local/management tests.
    // Normal account/IBAN/amount validation and manual payment approval still apply.
    whish: testMode ? { ...whish, enabled: true, qrVerified: true } : whish,
    bank: { ...bank, enabled: false }, // Retired manual Audi transfers cannot be re-enabled by test mode.
    testMode,
    testUntil: managementTesting ? null : testMode ? process.env.EBOOK_PAYMENT_TEST_UNTIL : null,
  };
}
