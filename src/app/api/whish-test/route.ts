import { NextRequest } from 'next/server';
import { z } from 'zod';
import { privateJson } from '@/lib/book-orders/whish-server';
import { boundedJson } from '@/lib/cybersource/bounded-input';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { createWhishReviewOrder, reviewerTokenSchema } from '@/lib/whish-pay/reviewer';
import { sandboxConfig, WhishError } from '@/lib/whish-pay/client';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('origin') !== sandboxConfig().origin) return privateJson({ error: 'Open the LEE review page.' }, 403);
    if (process.env.WHISH_PAY_CUSTOMER_TEST_ENABLED !== 'true') return privateJson({ error: 'Sandbox review is disabled.' }, 503);
    if (!rateLimit('whish-review:' + clientIp(request), 15, 60000)) return privateJson({ error: 'Please wait a minute.' }, 429);
    const token = reviewerTokenSchema.safeParse(request.headers.get('authorization')?.replace(/^Bearer /, ''));
    if (!token.success) return privateJson({ error: 'Use the complete review link supplied by LEE.' }, 403);
    const input = z.object({ requestId: z.string().uuid() }).strict().parse(await boundedJson(request, 1024));
    return privateJson(await createWhishReviewOrder(token.data, input.requestId));
  } catch (error) { return privateJson({ error: error instanceof WhishError ? error.code : 'Unable to prepare the review checkout.' }, 400); }
}
