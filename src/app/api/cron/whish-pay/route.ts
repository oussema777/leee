import { NextRequest } from 'next/server';
import { privateJson, expireWhishPayments } from '@/lib/book-orders/whish-server';
import { reconcileLiveWhish } from '@/lib/whish-pay/live';
import { drainWhishLiveMail } from '@/lib/whish-pay/live-mail';
import { drainEbookEmails } from '@/lib/ebooks/mail';
import { liveConfig, whishClient } from '@/lib/whish-pay/client';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) return privateJson({ error: 'Unauthorized' }, 401);
  try {
    // Authenticated, read-only rollout check: no orders, mail or cleanup.
    if (request.nextUrl.searchParams.get('probe') === '1') {
      return privateJson({ provider: await whishClient(liveConfig()).balance() });
    }
    const payments = await reconcileLiveWhish();
    return privateJson({ payments, mail: await drainWhishLiveMail(), ebooks: await drainEbookEmails(), expired: await expireWhishPayments() });
  } catch { return privateJson({ error: 'Payment reconciliation needs attention.' }, 503); }
}
