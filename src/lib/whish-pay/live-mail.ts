import { z } from 'zod';
import { db } from '@/lib/db';
import { lock } from '@/lib/ebooks/server';
import { deliver } from '@/lib/ebooks/mail';
import { renderNotification } from '@/lib/email';
import { loadLiveAttempt } from './live';
const schema = z.object({ attemptId: z.uuid(), event: z.enum(['CONFIRMED', 'REFUNDED', 'REVIEW']), sent: z.boolean(), nextAttemptAt: z.string() });
export async function drainWhishLiveMail() {
  const rows = await db.bookWhishSettings.findMany({ where: { id: { startsWith: 'whish-live-mail:' }, AND: [{ config: { path: ['sent'], equals: false } }, { config: { path: ['nextAttemptAt'], lte: new Date().toISOString() } }] }, orderBy: { updatedAt: 'asc' }, take: 20 });
  let sent = 0, errors = 0;
  for (const row of rows) {
    const claimed = await db.$transaction(async tx => {
      await lock(tx, row.id);
      const current = await tx.bookWhishSettings.findUniqueOrThrow({ where: { id: row.id } });
      const job = schema.parse(current.config);
      if (job.sent || Date.parse(job.nextAttemptAt) > Date.now()) return null;
      await tx.bookWhishSettings.update({ where: { id: row.id }, data: { config: { ...job, nextAttemptAt: new Date(Date.now() + 15 * 60000).toISOString() } } });
      return job;
    });
    if (!claimed) continue;
    try {
      const attempt = await loadLiveAttempt(claimed.attemptId);
      const valid = claimed.event === 'CONFIRMED' ? attempt.applied && attempt.status === 'success' : claimed.event === 'REFUNDED' ? attempt.refundApplied : !!attempt.reviewReason;
      if (valid) {
        const title = claimed.event === 'CONFIRMED' ? 'Whish payment confirmed' : claimed.event === 'REFUNDED' ? 'Whish refund confirmed' : 'Whish payment requires review';
        const html = renderNotification(title, claimed.event === 'REVIEW' ? 'Check this payment before taking further action. Do not request another payment.' : 'The payment status was verified directly with Whish.', [
          { label: 'Order', value: attempt.order.reference }, { label: 'Amount', value: (attempt.order.amountCents / 100).toFixed(2) + ' USD' },
        ], { href: 'https://www.theleeexperience.com/admin/' + (attempt.order.kind === 'BOOK' ? 'book-orders/' : 'ebook-orders/') + attempt.order.orderId, label: 'Review order' });
        await deliver(process.env.EMAIL_TO || 'info@theleeexperience.com', title + ' — ' + attempt.order.reference, html, row.id + ':team');
        if (attempt.order.kind === 'BOOK') {
          const order = await db.bookOrder.findUniqueOrThrow({ where: { id: attempt.order.orderId } });
          if (order.customerEmail) {
            const ar = order.locale === 'ar';
            const subject = claimed.event === 'CONFIRMED' ? (ar ? 'تم تأكيد الدفع' : 'Payment confirmed') : claimed.event === 'REFUNDED' ? (ar ? 'تم تأكيد استرداد المبلغ' : 'Refund confirmed') : (ar ? 'دفعتك قيد المراجعة' : 'Your payment is under review');
            const intro = claimed.event === 'CONFIRMED' ? (ar ? 'أكدت Whish دفعتك. سنتواصل معك لترتيب طلبك.' : 'Whish confirmed your payment. We will contact you to arrange your order.') : claimed.event === 'REFUNDED' ? (ar ? 'أكدت Whish استرداد المبلغ.' : 'Whish confirmed your refund.') : (ar ? 'لا تدفع مرة أخرى. تواصل معنا مع ذكر رقم الطلب.' : 'Please do not pay again. Contact us with your order reference.');
            await deliver(order.customerEmail, subject, renderNotification(subject, intro, [{ label: ar ? 'رقم الطلب' : 'Order', value: order.reference }], { href: `https://www.theleeexperience.com/${ar ? 'ar' : 'en'}/contact`, label: ar ? 'تواصل معنا' : 'Contact LEE' }, { direction: ar ? 'rtl' : 'ltr' }), row.id + ':customer');
          }
        }
      }
      await db.bookWhishSettings.update({ where: { id: row.id }, data: { config: { ...claimed, sent: true } } });
      sent++;
    } catch { errors++; }
  }
  return { sent, errors };
}
