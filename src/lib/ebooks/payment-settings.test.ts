import { afterEach, describe, expect, it, vi } from "vitest";
const saved = vi.hoisted(() => ({ enabled: false, qrVerified: false, termsVerified: true, accountName: "Saved account" }));
vi.mock("@/lib/book-orders/whish-server", () => ({ getWhishConfig: async () => saved, getBankAudiConfig: async () => saved }));
import { ebookPaymentSettings, ebookPaymentTestActive } from "./payment-settings";

afterEach(() => vi.unstubAllEnvs());
function configure() {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3107");
  vi.stubEnv("EBOOK_PAYMENT_TEST_UNTIL", "2026-10-12T18:00:00Z");
}
describe("temporary ebook QR testing", () => {
  it("expires at the deadline and rejects missing or invalid deadlines", () => {
    configure();
    expect(ebookPaymentTestActive(Date.parse("2026-10-12T17:59:59Z"))).toBe(true);
    expect(ebookPaymentTestActive(Date.parse("2026-10-12T18:00:00Z"))).toBe(false);
    vi.stubEnv("EBOOK_PAYMENT_TEST_UNTIL", "");
    expect(ebookPaymentTestActive(0)).toBe(false);
    vi.stubEnv("EBOOK_PAYMENT_TEST_UNTIL", "invalid");
    expect(ebookPaymentTestActive(0)).toBe(false);
  });
  it("cannot activate in a production process or for a hosted site", () => {
    configure();
    vi.stubEnv("NODE_ENV", "production");
    expect(ebookPaymentTestActive(0)).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://theleeexperience.com");
    expect(ebookPaymentTestActive(0)).toBe(false);
  });
  it("uses temporary copies without changing saved disabled/unverified settings", async () => {
    configure();
    vi.stubEnv("EBOOK_PAYMENT_TEST_UNTIL", new Date(Date.now() + 60000).toISOString());
    const test = await ebookPaymentSettings();
    expect(test.testMode).toBe(true);
    expect(test.whish.enabled).toBe(true);
    expect(test.bank.enabled).toBe(true);
    expect(saved.enabled).toBe(false);
    expect(saved.qrVerified).toBe(false);
    vi.stubEnv("EBOOK_PAYMENT_TEST_UNTIL", "");
    const normal = await ebookPaymentSettings();
    expect(normal.testMode).toBe(false);
    expect(normal.whish.enabled).toBe(false);
    expect(normal.bank.qrVerified).toBe(false);
  });
});
