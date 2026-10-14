import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { renderNotification } from "@/lib/email";
import { lock } from "./server";

export async function deliver(
  to: string,
  subject: string,
  html: string,
  key?: string,
) {
  if (process.env.EBOOK_DISABLE_EMAIL === "1") throw Error("Ebook email is disabled in this environment");
  if (!process.env.RESEND_API_KEY)
    throw Error("Email delivery is not configured");
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send(
    {
      from:
        process.env.EMAIL_FROM ||
        "The LEE Experience <noreply@theleeexperience.com>",
      to,
      subject,
      html,
    },
    key ? { idempotencyKey: key } : undefined,
  );
  if (error) throw Error("Email provider rejected delivery");
}
export async function queueOrderEmail(
  tx: Prisma.TransactionClient,
  order: {
    id: string;
    reference: string;
    locale: string;
    title: string;
    customerNote: string;
    reader: { email: string };
  },
  kind: "PENDING" | "ACCESS" | "CORRECTION" | "REVOKED",
) {
  const ar = order.locale === "ar";
  const subject =
    kind === "ACCESS"
      ? ar
        ? "كتابك الإلكتروني جاهز للقراءة"
        : "Your ebook is ready to read"
      : kind === "PENDING"
        ? ar
          ? "دفعتك بانتظار التحقق"
          : "Your payment is awaiting verification"
        : kind === "CORRECTION"
          ? ar
            ? "يرجى مراجعة تفاصيل الدفع"
            : "Please review your payment details"
          : ar
            ? "تم تحديث الوصول إلى كتابك"
            : "Your ebook access has been updated";
  const intro =
    kind === "PENDING"
      ? ar
        ? "سنرسل إليك رابط القراءة بعد تأكيد استلام الدفعة."
        : "Once your payment is verified, we will email you access to read your ebook on our website."
      : kind === "ACCESS"
        ? ar
          ? "سجّل الدخول ببريد الشراء لقراءة كتابك على الموقع."
          : "Sign in with your purchase email to read your book online."
        : order.customerNote;
  const url = new URL(
    `/${ar ? "ar" : "en"}/ebooks/library`,
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ).href;
  // A newer state supersedes unsent notifications (e.g. refund before an invitation retries).
  await tx.ebookEmail.updateMany({
    where: { orderId: order.id, sentAt: null, cancelled: false },
    data: { cancelled: true },
  });
  await tx.ebookEmail.create({
    data: {
      orderId: order.id,
      to: order.reader.email,
      subject,
      html: renderNotification(
        subject,
        intro,
        [
          { label: ar ? "الكتاب" : "Book", value: order.title },
          { label: ar ? "الطلب" : "Order", value: order.reference },
        ],
        { href: url, label: ar ? "كتبي الإلكترونية" : "My ebooks" },
        { direction: ar ? "rtl" : "ltr", eyebrow: "LEE EBOOKS" },
      ),
    },
  });
}
export async function drainEbookEmails() {
  const pending = await db.ebookEmail.findMany({
    where: {
      sentAt: null,
      cancelled: false,
      nextAttemptAt: { lte: new Date() },
    },
    take: 20,
    orderBy: { createdAt: "asc" },
  });
  let sent = 0;
  for (const email of pending) {
    const claimed = await db.$transaction(async (tx) => {
      await lock(tx, "ebook-mail:" + email.id);
      return tx.ebookEmail.updateMany({
        where: {
          id: email.id,
          sentAt: null,
          cancelled: false,
          nextAttemptAt: { lte: new Date() },
        },
        data: {
          attempts: { increment: 1 },
          nextAttemptAt: new Date(Date.now() + 15 * 60000),
        },
      });
    });
    if (!claimed.count) continue;
    try {
      await deliver(email.to, email.subject, email.html, "ebook/" + email.id);
      await db.ebookEmail.update({
        where: { id: email.id },
        data: { sentAt: new Date() },
      });
      sent++;
    } catch {
      /* Durable outbox remains available to cron and manual retry. */
    }
  }
  return sent;
}
