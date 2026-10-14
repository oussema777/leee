import { randomInt, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { renderNotification } from "@/lib/email";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { emailSchema } from "@/lib/ebooks/policy";
import {
  body,
  codeDigest,
  EbookError,
  endpoint,
  hash,
  json,
  limited,
  lock,
  randomToken,
  READER_COOKIE,
  readerSession,
} from "@/lib/ebooks/server";
import { deliver } from "@/lib/ebooks/mail";

export async function GET(request: NextRequest) {
  return endpoint(request, async () => {
    const reader = await readerSession(request);
    return json({ reader: reader ? { email: reader.email } : null });
  });
}
export async function POST(request: NextRequest) {
  return endpoint(request, async () => {
    const input = await body(request);
    const parsed = emailSchema.safeParse(input.email);
    if (!parsed.success) throw new EbookError("Enter a valid email address.");
    const email = parsed.data;
    if (input.action === "REQUEST") {
      if (
        !(await limited("login-ip:" + hash(clientIp(request)), 20, 3600)) ||
        !(await limited("login-email:" + hash(email), 5, 3600))
      )
        throw new EbookError("Too many requests. Please try again later.", 429);
      const code = String(randomInt(100000, 1000000));
      const digest = codeDigest(email, code);
      await db.$transaction(async (tx) => {
        await lock(tx, "ebook-login:" + email);
        const old = await tx.ebookLoginCode.findUnique({ where: { email } });
        if (old && +old.createdAt > Date.now() - 60000)
          throw new EbookError(
            "Wait one minute before requesting another code.",
            429,
          );
        const data = {
          digest,
          attempts: 0,
          expiresAt: new Date(Date.now() + 10 * 60000),
          createdAt: new Date(),
        };
        await tx.ebookLoginCode.upsert({
          where: { email },
          create: { email, ...data },
          update: data,
        });
      });
      const ar = input.locale === "ar";
      try {
        await deliver(
          email,
          ar ? "رمز الدخول إلى كتبك الإلكترونية" : "Your ebook sign-in code",
          renderNotification(
            ar ? "رمز الدخول" : "Sign in to your ebooks",
            ar
              ? "صالح لمدة عشر دقائق. لا تشارك هذا الرمز."
              : "Valid for ten minutes. Do not share this code.",
            [{ label: ar ? "الرمز" : "Code", value: code }],
            undefined,
            { direction: ar ? "rtl" : "ltr" },
          ),
        );
      } catch {
        await db.ebookLoginCode.deleteMany({ where: { email, digest } });
        throw new EbookError(
          "We could not send your code. Please try again shortly.",
          503,
        );
      }
      return json({ success: true });
    }
    if (input.action !== "VERIFY" || !/^\d{6}$/.test(input.code || ""))
      throw new EbookError("Enter the six-digit code from your email.");
    if (!(await limited("verify-ip:" + hash(clientIp(request)), 50, 3600)))
      throw new EbookError("Too many attempts. Please try again later.", 429);
    const token = randomToken();
    const expiresAt = new Date(Date.now() + 30 * 86400000);
    const success = await db.$transaction(async (tx) => {
      await lock(tx, "ebook-login:" + email);
      const row = await tx.ebookLoginCode.findUnique({ where: { email } });
      if (!row || row.expiresAt <= new Date() || row.attempts >= 5)
        return false;
      await tx.ebookLoginCode.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      if (
        !timingSafeEqual(
          Buffer.from(row.digest, "hex"),
          Buffer.from(codeDigest(email, input.code), "hex"),
        )
      )
        return false;
      await tx.ebookLoginCode.delete({ where: { email } });
      const reader = await tx.ebookReader.upsert({
        where: { email },
        create: { email },
        update: {},
      });
      await tx.ebookSession.create({
        data: { id: hash(token), readerId: reader.id, expiresAt },
      });
      return true;
    });
    if (!success)
      throw new EbookError(
        "The code is invalid or expired. Request a new code.",
        401,
      );
    const response = json({ success: true });
    response.cookies.set(READER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return response;
  });
}
export async function DELETE(request: NextRequest) {
  return endpoint(request, async () => {
    const token = request.cookies.get(READER_COOKIE)?.value;
    if (token) await db.ebookSession.deleteMany({ where: { id: hash(token) } });
    const response = json({ success: true });
    response.cookies.delete(READER_COOKIE);
    return response;
  });
}
