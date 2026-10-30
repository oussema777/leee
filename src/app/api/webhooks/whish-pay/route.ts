import { NextRequest } from 'next/server';
import { privateJson } from '@/lib/book-orders/whish-server';
import { attemptIdSchema, checkAttempt } from '@/lib/whish-pay/sandbox';
import { WhishError } from '@/lib/whish-pay/client';
import { rateLimit } from '@/lib/rate-limit';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const id = attemptIdSchema.safeParse(request.nextUrl.searchParams.get('id'));
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!id.success || !/^[a-f0-9]{64}$/.test(token)) return privateJson({ error: 'Invalid callback.' }, 400);
  if (!rateLimit('whish-callback:' + id.data, 20, 60000)) return privateJson({ error: 'Retry later.' }, 429);
  try {
    // Query parameters and redirect outcomes NEVER establish payment success.
    await checkAttempt(id.data, token);
    return privateJson({ received: true });
  } catch (error) {
    if (error instanceof WhishError && ['INVALID_CALLBACK', 'ATTEMPT_NOT_FOUND'].includes(error.code)) return privateJson({ error: 'Invalid callback.' }, 403);
    // Keep the failure visible; the admin status check can reconcile a missed callback.
    return privateJson({ error: 'Verification unavailable. Retry later.' }, 503);
  }
}
