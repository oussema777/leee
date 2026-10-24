import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, withPaymentAdmin } from '@/lib/book-orders/whish-server';
import { paymentOperations, recordPaymentAction, opsAction } from '@/lib/cybersource/live-operations';
import { liveCustomerEnabled } from '@/lib/cybersource/live-config';
export async function GET(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request); if ('error' in auth) return auth.error!;
    const page = Number(request.nextUrl.searchParams.get('page') || 1);
    if (!Number.isInteger(page) || page < 1 || page > 10000) return privateJson({ error: 'Invalid page.' }, 400);
    return privateJson({ ...await paymentOperations(db, page, request.nextUrl.searchParams.get('attention') !== 'false'), liveEnabled: liveCustomerEnabled(), jobsEnabled: process.env.CYBERSOURCE_LIVE_JOBS_ENABLED === 'true' });
  } catch { return privateJson({ error: 'Payment review is unavailable. Check the database rollout and try again.' }, 503); }
}
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('origin') !== 'https://www.theleeexperience.com') return privateJson({ error: 'Open payment review on the LEE website.' }, 403);
    const auth = await withPaymentAdmin(request); if ('error' in auth) return auth.error!;
    if (!request.headers.get('content-type')?.startsWith('application/json')) return privateJson({ error: 'Send JSON.' }, 415);
    const reader = request.body?.getReader(); if (!reader) return privateJson({ error: 'Missing request.' }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 10000) return privateJson({ error: 'Request too large.' }, 413); chunks.push(value); } } finally { await reader.cancel().catch(() => {}); }
    const input = opsAction.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (!input.success) return privateJson({ error: 'Add a note of 5–2000 characters and refresh the payment before trying again.' }, 400);
    return privateJson(await recordPaymentAction(db, input.data, auth.session.userId));
  } catch (error) {
    if (error instanceof SyntaxError) return privateJson({ error: 'Invalid JSON.' }, 400);
    if (error instanceof Error && ['ATTEMPT_CHANGED', 'CHECK_NOT_APPLICABLE', 'ATTEMPT_NOT_FOUND'].includes(error.message)) return privateJson({ error: 'This payment changed or cannot be checked. Refresh before acting.' }, 409);
    return privateJson({ error: 'Could not save this action. Refresh before trying again.' }, 503);
  }
}
