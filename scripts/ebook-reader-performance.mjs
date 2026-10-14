// Read-only reader timing, using a short-lived session for the explicitly named test order.
// The session is removed in finally; no orders, receipts, progress or emails are changed.
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";
nextEnv.loadEnvConfig(process.cwd());
const db = new PrismaClient();
const email = process.argv[2], reference = process.argv[3];
const token = randomBytes(32).toString("hex"), sessionId = createHash("sha256").update(token).digest("hex");
try {
  const order = await db.ebookOrder.findUnique({ where: { reference }, include: { reader: true } });
  if (!reference?.startsWith("EB-TEST-") || order?.reader.email !== email || order.snapshot?.testMode !== true) throw Error("Expected the owning reader and explicit test order");
  await db.ebookSession.create({ data: { id: sessionId, readerId: order.readerId, expiresAt: new Date(Date.now() + 300000) } });
  const samples = [];
  for (const path of ["", "?page=2", "?page=2", "?page=3", "?page=3"]) {
    const start = performance.now();
    const response = await fetch(`http://localhost:3107/api/ebooks/read/${order.ebookId}${path}`, { headers: { Cookie: `ebook-reader=${token}`, Accept: process.argv.includes("--avif") ? "image/avif,image/webp" : "image/webp" } });
    const body = await response.arrayBuffer();
    samples.push({ request: path || "metadata", status: response.status, ms: Math.round(performance.now() - start), bytes: body.byteLength, format: response.headers.get("content-type") });
    if (!response.ok) throw Error(`Reader check returned ${response.status}`);
  }
  console.log(JSON.stringify(samples));
} finally { await db.ebookSession.deleteMany({ where: { id: sessionId } }); await db.$disconnect(); }
