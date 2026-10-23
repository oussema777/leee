import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { startCheckout, checkResult } from "./checkout";
const url = process.env.CYBERSOURCE_TEST_DATABASE_URL;
if (url && (!/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/aramex_test$/.test(url))) throw Error("Local test database required");
describe.skipIf(!url)("persistent test checkout", () => {
  const db = new PrismaClient({ datasources: { db: { url: url || "postgresql://postgres@127.0.0.1:55441/aramex_test" } } });
  const reference = "AUDI-TEST-" + randomUUID(); let orderId: string;
  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", "local-test-secret".repeat(4));
    vi.stubEnv("CYBERSOURCE_TEST_MERCHANT_ID", "test"); vi.stubEnv("CYBERSOURCE_TEST_KEY_ID", "test-key"); vi.stubEnv("CYBERSOURCE_TEST_SECRET_KEY", Buffer.alloc(32, 7).toString("base64"));
    const order = await db.bookOrder.create({ data: { reference, locale: "en", package: "SINGLE", purpose: "SELF", requestedBookCount: 1, priceCents: 900, customerName: "Test", customerPhone: "70123456", fulfillmentMethod: "DELIVERY", paymentMethod: "BANK_AUDI" } }); orderId = order.id;
  });
  afterAll(async () => { if (orderId) { await db.$executeRaw`DELETE FROM "CybersourceTestAttempt" WHERE "bookOrderId" = ${orderId}`; await db.bookOrder.delete({ where: { id: orderId } }); } await db.$disconnect(); vi.unstubAllEnvs(); });
  it("reuses concurrent and refreshed sessions; verifies once without paying the order", async () => {
    const selection = { kind: "BOOK" as const, reference };
    const create = vi.fn(async () => ({ sessionJwt: "test-only", clientLibrary: "https://testup.cybersource.com/uc/test.js", clientLibraryIntegrity: "sha384-YWJj", expiresAt: new Date(Date.now() + 600000).toISOString() }));
    const [a, b] = await Promise.all([startCheckout(db, selection, "tester", false, create), startCheckout(db, selection, "tester", false, create)]);
    expect(a.attempt.id).toBe(b.attempt.id); expect(create).toHaveBeenCalledTimes(1);
    const resumed = await startCheckout(db, selection, "tester", false, create); expect(resumed.session?.sessionJwt).toBe("test-only"); expect(create).toHaveBeenCalledTimes(1);
    const transactionId = "123456789012";
    const lookup = vi.fn(async () => ({ id: transactionId, merchantId: "test", clientReferenceInformation: { code: a.attempt.id }, orderInformation: { amountDetails: { totalAmount: "9.00", currency: "USD" } }, applicationInformation: { applications: [{ name: "ics_auth", reasonCode: 100, rCode: 1 }, { name: "ics_bill", reasonCode: 100, rCode: 1 }] } }));
    expect((await checkResult(db, a.attempt.id, transactionId, lookup)).state).toBe("TEST_CAPTURED");
    await checkResult(db, a.attempt.id, transactionId, lookup); expect(lookup).toHaveBeenCalledTimes(1);
    await expect(checkResult(db, a.attempt.id, "999999999999", lookup)).rejects.toThrow("TRANSACTION_CHANGED");
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: orderId } })).paymentStatus).toBe("PENDING");
    expect((await startCheckout(db, selection, "tester", true, create)).session).toBeNull(); expect(create).toHaveBeenCalledTimes(1);
  });
});
