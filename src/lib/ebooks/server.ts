import { createHash, createHmac, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  withPaymentAdmin,
  PRIVATE_HEADERS,
} from "@/lib/book-orders/whish-server";
import { ReceiptError } from "@/lib/book-orders/whish-receipts";

export const READER_COOKIE = "ebook-reader";
export const headers = {
  ...PRIVATE_HEADERS,
  "X-Content-Type-Options": "nosniff",
};
export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
export class EbookError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function codeDigest(email: string, code: string) {
  const secret = process.env.EBOOK_AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32)
    throw new EbookError("Reader sign-in is not configured.", 503);
  return createHmac("sha256", secret)
    .update(email + ":" + code)
    .digest("hex");
}
export const randomToken = () => randomBytes(32).toString("hex");
export async function lock(tx: Prisma.TransactionClient, key: string) {
  await tx.$queryRaw(
    Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`,
  );
}
export async function limited(key: string, max: number, seconds: number) {
  const now = new Date().toISOString(), expires = new Date(Date.now() + seconds * 1000).toISOString();
  // One atomic statement instead of a transaction with four serial round trips.
  const result = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "EbookRateLimit" ("key", "count", "expiresAt") VALUES (${key}, 1, ${expires}::timestamp)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "EbookRateLimit"."expiresAt" <= ${now}::timestamp THEN 1 ELSE "EbookRateLimit"."count" + 1 END,
      "expiresAt" = CASE WHEN "EbookRateLimit"."expiresAt" <= ${now}::timestamp THEN ${expires}::timestamp ELSE "EbookRateLimit"."expiresAt" END
    WHERE "EbookRateLimit"."expiresAt" <= ${now}::timestamp OR "EbookRateLimit"."count" < ${max}
    RETURNING "count"`;
  return result.length > 0;
}
export function sameOrigin(request: NextRequest) {
  if (["GET", "HEAD"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url);
  const allowed = new Set([expected.origin]);
  // Hosting may redirect the configured apex domain to www (or vice versa).
  // Allow only that exact alias, retaining the configured protocol and port.
  if (expected.hostname.includes(".") && !/^[\d.]+$/.test(expected.hostname)) {
    const alias = new URL(expected.origin);
    alias.hostname = expected.hostname.startsWith("www.")
      ? expected.hostname.slice(4)
      : "www." + expected.hostname;
    allowed.add(alias.origin);
  }
  if (!origin || !allowed.has(origin))
    throw new EbookError("Please reload the website and try again.", 403);
}
export async function readerSession(request: NextRequest) {
  const token = request.cookies.get(READER_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const readers = await db.$queryRaw<{ id: string; email: string; createdAt: Date }[]>`
    SELECT r."id", r."email", r."createdAt" FROM "EbookSession" s
    JOIN "EbookReader" r ON r."id" = s."readerId"
    WHERE s."id" = ${hash(token)} AND s."expiresAt" > ${new Date().toISOString()}::timestamp`;
  return readers[0] || null;
}
export async function requireReader(request: NextRequest) {
  const reader = await readerSession(request);
  if (!reader)
    throw new EbookError("Sign in with your purchase email to continue.", 401);
  return reader;
}
export async function requireEbookAdmin(request: NextRequest) {
  const auth = await withPaymentAdmin(request);
  if ("error" in auth)
    throw new EbookError(
      "Administrator access is required.",
      auth.error?.status || 401,
    );
  return auth.session;
}
export async function endpoint(
  request: NextRequest,
  work: () => Promise<Response>,
) {
  try {
    sameOrigin(request);
    return await work();
  } catch (error) {
    if (error instanceof EbookError)
      return json({ error: error.message }, error.status);
    if (error instanceof ReceiptError)
      return json({ error: error.message }, 400);
    if (error instanceof SyntaxError)
      return json({ error: "Invalid request." }, 400);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return json(
        {
          error:
            "This record or transaction reference already exists. Reload and check before retrying.",
        },
        409,
      );
    console.error(
      "Ebook request failed",
      error instanceof Error ? error.name : "unknown",
    );
    return json(
      {
        error: "Ebooks are temporarily unavailable. Please try again shortly.",
      },
      503,
    );
  }
}
export async function body(request: Request) {
  const stream = request.body?.getReader();
  if (!stream) throw new EbookError("Request body is required.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await stream.read();
      if (done) break;
      length += value.length;
      if (length > 32000) {
        await stream.cancel();
        throw new EbookError("Request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    stream.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
