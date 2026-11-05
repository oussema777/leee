import { NextRequest } from 'next/server';
import { z } from 'zod';
import { privateJson } from '@/lib/book-orders/whish-server';
import { checkLiveWhish } from '@/lib/whish-pay/live';
import { WhishError } from '@/lib/whish-pay/client';
import { limited } from '@/lib/ebooks/server';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || '', token = request.nextUrl.searchParams.get('token') || '';
  if (!z.uuid().safeParse(id).success || !/^[a-f0-9]{64}$/.test(token)) return privateJson({ error: 'Invalid callback.' }, 400);
  if (!await limited('whish-live-callback:' + id, 30, 60)) return privateJson({ error: 'Retry later.' }, 429);
  try { await checkLiveWhish(id, token); return privateJson({ received: true }); }
  catch (error) {
    if (error instanceof WhishError && ['INVALID_CALLBACK', 'ATTEMPT_NOT_FOUND'].includes(error.code)) return privateJson({ error: 'Invalid callback.' }, 403);
    return privateJson({ error: 'Verification unavailable. Retry later.' }, 503);
  }
}
