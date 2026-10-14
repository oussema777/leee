// Explicit account-scoped local preview. Leaves payment and receipt records unchanged.
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient();
const email = process.argv[2]?.trim().toLowerCase(), reference = process.argv[3];
if (!email || !reference?.startsWith("EB-TEST-")) throw Error("Provide reader email and test order reference");
try {
  const order = await db.ebookOrder.findUnique({ where: { reference }, include: { reader: true } });
  if (!order || order.reader.email !== email || order.snapshot?.testMode !== true) throw Error("The supplied account must own this test order");
  if (!["AWAITING_PAYMENT", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(order.state)) throw Error("Expected a pending test order");
  if (!process.argv.includes("--apply")) {
    console.log(JSON.stringify({ reference, email, state: order.state, testMode: true, ebookId: order.ebookId }));
  } else {
    const expiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
    await db.$transaction(async tx => {
      const existing = await tx.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId: order.readerId, ebookId: order.ebookId } } });
      if (existing && existing.orderId !== order.id) throw Error("Another entitlement already exists; inspect it first");
      await tx.ebookAccess.upsert({
        where: { readerId_ebookId: { readerId: order.readerId, ebookId: order.ebookId } },
        create: { readerId: order.readerId, ebookId: order.ebookId, orderId: order.id }, update: { active: true },
      });
      await tx.ebookOrderEvent.create({ data: { orderId: order.id, actor: "codex:user-requested-preview", action: "LOCAL_READER_PREVIEW", details: { expiresAt, note: "Account owner requested access to review the reader. Local development only; no payment verified, no receipt or email created." } } });
    });
    console.log(JSON.stringify({ reference, email, state: order.state, expiresAt, readerUrl: `http://localhost:3107/en/ebooks/read/${order.ebookId}` }));
  }
} finally { await db.$disconnect(); }
