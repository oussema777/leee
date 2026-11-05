import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withPaymentAdmin, privateJson } from '@/lib/book-orders/whish-server';
import { liveConfig, liveWhishEnabled } from '@/lib/whish-pay/client';
import { livePrefix, liveAttemptSchema } from '@/lib/whish-pay/live';
import { getPaymentMethods } from '@/lib/payment-methods';
export async function GET(request: NextRequest) {
  const auth = await withPaymentAdmin(request); if ('error' in auth) return auth.error!;
  try {
    let configured = true; try { liveConfig(); } catch { configured = false; }
    const rows = await db.bookWhishSettings.findMany({ where: { id: { startsWith: livePrefix } }, orderBy: { updatedAt: 'desc' }, take: 50 });
    return privateJson({ configured, enabled: liveWhishEnabled() && (await getPaymentMethods()).WHISH, refundsEnabled: process.env.WHISH_PAY_LIVE_REFUNDS_ENABLED === 'true', attempts: rows.flatMap(row => {
      const parsed = liveAttemptSchema.safeParse(row.config); if (!parsed.success) return [];
      const a = parsed.data;
      return [{ id: a.id, reference: a.order.reference, kind: a.order.kind, orderId: a.order.orderId, amountCents: a.order.amountCents, status: a.status, applied: a.applied, refundApplied: a.refundApplied, reviewReason: a.reviewReason, checkedAt: a.checkedAt, errorCode: a.errorCode }];
    }) });
  } catch { return privateJson({ error: 'Could not load production payment records.' }, 503); }
}
