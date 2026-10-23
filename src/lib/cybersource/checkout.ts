import { createHash, randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createTestSession } from "./session";
import { decryptSession, encryptSession } from "./session-storage";
import { assessTestTransaction, lookupTestTransaction, transactionIdSchema } from "./transaction";
import { testCredentials } from "./test-session-request";

export const selectionSchema = z.object({ kind: z.enum(["BOOK", "EBOOK"]), reference: z.string().min(1).max(80).regex(/^[A-Za-z0-9-]+$/) }).strict();
export type Selection = z.infer<typeof selectionSchema>;
type Db = Pick<PrismaClient, "$transaction" | "$queryRaw">;
type Session = Awaited<ReturnType<typeof createTestSession>>;
export type Attempt = { id: string; bookOrderId: string | null; ebookOrderId: string | null; orderReference: string; amountCents: number; currency: string; environment: string; fingerprint: string; state: string; sessionCipher: string | null; expiresAt: Date | null; transactionId: string | null; verifiedAt: Date | null; createdAt: Date; updatedAt: Date };
export class CheckoutError extends Error { constructor(public code: string, public status = 409) { super(code); } }
const terminal = new Set(["TEST_AUTHORIZED", "TEST_CAPTURED", "TEST_DECLINED"]);

async function source(tx: Prisma.TransactionClient, selection: Selection) {
  if (selection.kind === "BOOK") {
    const order = await tx.bookOrder.findUnique({ where: { reference: selection.reference }, select: { id: true, reference: true, priceCents: true, currency: true, status: true, paymentStatus: true } });
    if (!order) throw new CheckoutError("ORDER_NOT_FOUND", 404);
    if (order.currency !== "USD" || order.paymentStatus !== "PENDING" || order.status === "CANCELLED") throw new CheckoutError("ORDER_NOT_ELIGIBLE");
    return { id: order.id, reference: order.reference, amountCents: order.priceCents, fingerprint: createHash("sha256").update(JSON.stringify(order)).digest("hex") };
  }
  const order = await tx.ebookOrder.findUnique({ where: { reference: selection.reference }, select: { id: true, reference: true, priceCents: true, state: true } });
  if (!order) throw new CheckoutError("ORDER_NOT_FOUND", 404);
  if (!["AWAITING_PAYMENT", "CHANGES_REQUESTED"].includes(order.state)) throw new CheckoutError("ORDER_NOT_ELIGIBLE");
  return { id: order.id, reference: order.reference, amountCents: order.priceCents, fingerprint: createHash("sha256").update(JSON.stringify(order)).digest("hex") };
}
async function lock(tx: Prisma.TransactionClient, value: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${"cybersource-test:" + value}, 0))::text`;
}
async function latest(tx: Prisma.TransactionClient, selection: Selection, orderId: string) {
  const rows = await tx.$queryRaw<Attempt[]>(Prisma.sql`SELECT * FROM "CybersourceTestAttempt" WHERE ${selection.kind === "BOOK" ? Prisma.sql`"bookOrderId" = ${orderId}` : Prisma.sql`"ebookOrderId" = ${orderId}`} ORDER BY "createdAt" DESC, "id" DESC LIMIT 1`);
  return rows[0] ?? null;
}
export function publicAttempt(attempt: Attempt) {
  return { id: attempt.id, reference: attempt.orderReference, amountCents: attempt.amountCents, currency: "USD", environment: "TEST", state: attempt.state,
    expiresAt: attempt.expiresAt?.toISOString() ?? null, transactionId: attempt.transactionId, verifiedAt: attempt.verifiedAt?.toISOString() ?? null };
}
export async function inspectCheckout(db: Db, selection: Selection) {
  return db.$transaction(async tx => { const order = await source(tx, selection); const attempt = await latest(tx, selection, order.id);
    return { reference: order.reference, amountCents: order.amountCents, currency: "USD", attempt: attempt ? publicAttempt(attempt) : null }; });
}
export async function startCheckout(db: Db, selection: Selection, actor: string, retry = false, create: (amount: number, reference: string) => Promise<Session> = (amount, reference) => createTestSession(amount, process.env, fetch, reference)) {
  // Check encryption before claiming an attempt.
  encryptSession({}, "configuration-check");
  const claimed = await db.$transaction(async tx => {
    await lock(tx, selection.kind + ":" + selection.reference);
    const order = await source(tx, selection);
    const old = await latest(tx, selection, order.id);
    if (old && !(retry && ["TEST_DECLINED", "SESSION_FAILED"].includes(old.state))) {
      if (old.fingerprint !== order.fingerprint) throw new CheckoutError("ORDER_CHANGED");
      return { attempt: old, created: false };
    }
    const id = "LEE-T-" + randomUUID();
    const rows = await tx.$queryRaw<Attempt[]>`INSERT INTO "CybersourceTestAttempt" ("id", "bookOrderId", "ebookOrderId", "orderReference", "amountCents", "fingerprint", "createdBy")
      VALUES (${id}, ${selection.kind === "BOOK" ? order.id : null}, ${selection.kind === "EBOOK" ? order.id : null}, ${order.reference}, ${order.amountCents}, ${order.fingerprint}, ${actor}) RETURNING *`;
    return { attempt: rows[0], created: true };
  });
  let attempt = claimed.attempt;
  if (claimed.created) {
    try {
      const session = await create(attempt.amountCents, attempt.id);
      const cipher = encryptSession(session, attempt.id);
      const rows = await db.$queryRaw<Attempt[]>`UPDATE "CybersourceTestAttempt" SET "state" = 'READY', "sessionCipher" = ${cipher}, "expiresAt" = ${new Date(session.expiresAt)}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${attempt.id} AND "state" = 'CREATING' RETURNING *`;
      attempt = rows[0];
    } catch {
      // A session never reached the browser, so no card could be entered through it.
      await db.$queryRaw`UPDATE "CybersourceTestAttempt" SET "state" = 'SESSION_FAILED', "sessionCipher" = NULL, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${attempt.id} AND "state" = 'CREATING' RETURNING "id"`;
      throw new CheckoutError("SESSION_FAILED", 503);
    }
  }
  if (attempt.state === "READY" && attempt.expiresAt && attempt.expiresAt.getTime() > Date.now() && attempt.sessionCipher) {
    return { attempt: publicAttempt(attempt), session: decryptSession(attempt.sessionCipher, attempt.id) as Session };
  }
  // Expiry or interrupted checkout is not evidence of a failed payment.
  return { attempt: publicAttempt(attempt), session: null };
}
export async function checkResult(db: Db, attemptId: string, transactionId: string, lookup: typeof lookupTestTransaction = lookupTestTransaction) {
  transactionIdSchema.parse(transactionId);
  const rows = await db.$queryRaw<Attempt[]>`SELECT * FROM "CybersourceTestAttempt" WHERE "id" = ${attemptId}`;
  const attempt = rows[0];
  if (!attempt || attempt.environment !== "TEST") throw new CheckoutError("ATTEMPT_NOT_FOUND", 404);
  if (attempt.transactionId && attempt.transactionId !== transactionId) throw new CheckoutError("TRANSACTION_CHANGED");
  if (terminal.has(attempt.state)) return publicAttempt(attempt);
  if (!["READY", "REVIEW_REQUIRED"].includes(attempt.state)) throw new CheckoutError("ATTEMPT_NOT_READY");
  const raw = await lookup(transactionId);
  const outcome = assessTestTransaction(raw, { transactionId, merchantId: testCredentials().merchantId, reference: attempt.id, amountCents: attempt.amountCents });
  return db.$transaction(async tx => {
    await lock(tx, attempt.id);
    const current = (await tx.$queryRaw<Attempt[]>`SELECT * FROM "CybersourceTestAttempt" WHERE "id" = ${attempt.id} FOR UPDATE`)[0];
    if (current.transactionId && current.transactionId !== transactionId) throw new CheckoutError("TRANSACTION_CHANGED");
    if (terminal.has(current.state)) return publicAttempt(current);
    const updated = await tx.$queryRaw<Attempt[]>`UPDATE "CybersourceTestAttempt" SET "state" = ${outcome}, "transactionId" = ${transactionId}, "verifiedAt" = CURRENT_TIMESTAMP, "sessionCipher" = NULL, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${attempt.id} RETURNING *`;
    // Deliberately no BookOrder/EbookOrder, stock or reading-access updates in TEST.
    return publicAttempt(updated[0]);
  });
}
