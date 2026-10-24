import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { renderNotification } from '@/lib/email';

export const cardMailSchema = z.object({ from: z.string().min(1).max(320), to: z.string().email(), subject: z.string().min(1).max(256), html: z.string().min(1).max(200000) }).strict();
export type CardMail = z.infer<typeof cardMailSchema>;
export type MailEvent = { id: string; attemptId: string; event: string };

// Prepare before the first send, then persist this exact payload for retries.
// Never sends to a gift recipient; customer confirmation goes to the purchaser.
export async function prepareCardMail(db: Pick<PrismaClient, '$queryRaw' | 'bookOrder' | 'ebookOrder'>, event: MailEvent): Promise<CardMail | null> {
  const a = (await db.$queryRaw<{ bookOrderId: string | null; ebookOrderId: string | null; state: string; orderReference: string; reviewReason: string | null; environment: string }[]>`SELECT "bookOrderId", "ebookOrderId", "state", "orderReference", "reviewReason", "environment" FROM "CybersourceLiveAttempt" WHERE "id" = ${event.attemptId}`)[0];
  if (!a || a.environment !== 'PRODUCTION') throw Error('INVALID_MAIL_EVENT');
  const from = process.env.EMAIL_FROM || 'The LEE Experience <noreply@theleeexperience.com>';
  if (event.event === 'PAYMENT_REVIEW_REQUIRED') {
    if (a.state !== 'REVIEW_REQUIRED') return null;
    return cardMailSchema.parse({ from, to: process.env.EMAIL_TO || 'info@theleeexperience.com',
      subject: 'Card payment needs review - ' + a.orderReference,
      html: renderNotification('Card payment needs review', 'A verified payment could not be applied automatically. Check the order before fulfilment or a refund.', [
        { label: 'Order', value: a.orderReference }, { label: 'Reason', value: a.reviewReason || 'Review required' },
      ], { href: 'https://www.theleeexperience.com/admin/' + (a.bookOrderId ? 'book-orders/' + encodeURIComponent(a.bookOrderId) : 'ebook-orders/' + encodeURIComponent(a.ebookOrderId!)), label: 'Review order' }),
    });
  }
  if (event.event !== 'PAYMENT_CONFIRMED' || a.state !== 'APPLIED') throw Error('INVALID_MAIL_EVENT');
  const book = a.bookOrderId ? await db.bookOrder.findUnique({ where: { id: a.bookOrderId } }) : null;
  const ebook = a.ebookOrderId ? await db.ebookOrder.findUnique({ where: { id: a.ebookOrderId }, include: { reader: { select: { email: true } }, access: { select: { active: true } } } }) : null;
  if (book && (book.paymentStatus !== 'PAID' || book.status === 'CANCELLED') || ebook && (ebook.state !== 'VERIFIED' || !ebook.access?.active)) return null;
  if (!book && !ebook) throw Error('ORDER_NOT_FOUND');
  const to = book?.customerEmail || ebook?.reader.email;
  if (!to) return null;
  const order = book || ebook!, ar = order.locale === 'ar';
  const heading = ar ? 'تم تأكيد الدفع' : 'Your payment is confirmed';
  return cardMailSchema.parse({ from, to, subject: heading + ' - ' + order.reference,
    html: renderNotification(heading, ar ? 'تم استلام دفعتك والتحقق منها بنجاح. شكرًا لدعمك.' : 'Your card payment has been verified. Thank you for supporting The LEE Experience.', [
      { label: ar ? 'رقم الطلب' : 'Order reference', value: order.reference },
      { label: ar ? 'المبلغ' : 'Amount paid', value: (order.priceCents / 100).toFixed(2) + ' USD' },
    ], ebook ? { href: 'https://www.theleeexperience.com/' + (ar ? 'ar' : 'en') + '/ebooks/orders/' + encodeURIComponent(ebook.id), label: ar ? 'افتح طلب كتابك' : 'Open your ebook order' } : undefined, { direction: ar ? 'rtl' : 'ltr' }),
  });
}

export async function sendCardMail(payload: CardMail, key: string, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<string> {
  if (process.env.CYBERSOURCE_LIVE_EMAIL_ENABLED !== 'true' || !process.env.RESEND_API_KEY) throw Error('CARD_EMAIL_DISABLED');
  const response = await fetcher('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal,
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(cardMailSchema.parse(payload)),
  });
  if (!response.ok) { await response.body?.cancel(); throw Error('CARD_EMAIL_REJECTED'); }
  const data = await response.json();
  if (typeof data.id !== 'string' || !data.id || data.id.length > 200) throw Error('CARD_EMAIL_RESPONSE_INVALID');
  return data.id;
}
