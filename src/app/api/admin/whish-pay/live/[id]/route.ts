import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withPaymentAdmin, privateJson } from '@/lib/book-orders/whish-server';
import { boundedJson, InputTooLarge } from '@/lib/cybersource/bounded-input';
import { checkLiveWhish } from '@/lib/whish-pay/live';
import { refundLiveWhish } from '@/lib/whish-pay/live-refund';
import { liveConfig, WhishError } from '@/lib/whish-pay/client';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await withPaymentAdmin(request); if ('error' in auth) return auth.error!;
  try {
    if (request.headers.get('origin') !== liveConfig().origin) return privateJson({ error: 'Open this action on the LEE website.' }, 403);
    const id = z.uuid().parse((await context.params).id);
    const input = z.discriminatedUnion('action', [z.object({ action: z.literal('check') }).strict(), z.object({ action: z.literal('refund'), reason: z.string().trim().min(1).max(500), expectedAmountCents: z.number().int().min(100), confirmed: z.literal(true) }).strict()]).parse(await boundedJson(request, 4096));
    return privateJson(input.action === 'check' ? await checkLiveWhish(id) : await refundLiveWhish(id, input.reason, auth.session.userId, input.expectedAmountCents));
  } catch (error) {
    if (error instanceof InputTooLarge) return privateJson({ error: 'Request too large.' }, 413);
    if (error instanceof z.ZodError || error instanceof SyntaxError) return privateJson({ error: 'Check the request details.' }, 400);
    return privateJson({ error: error instanceof WhishError ? error.code : 'Payment action could not be confirmed. Check status before retrying.' }, 503);
  }
}
