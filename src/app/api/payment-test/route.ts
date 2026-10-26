import { NextRequest } from 'next/server';
import { z } from 'zod';
import { privateJson } from '@/lib/book-orders/whish-server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { boundedJson, InputTooLarge } from '@/lib/cybersource/bounded-input';
import { customerCardEnabled } from '@/lib/cybersource/customer-config';
import { getPaymentMethods } from '@/lib/payment-methods';
import { createReviewerOrder, ReviewerError, reviewerTokenSchema } from '@/lib/cybersource/reviewer-access';

export const runtime = 'nodejs';
const schema = z.object({ requestId: z.string().uuid() }).strict();
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('origin') !== 'https://www.theleeexperience.com') return privateJson({ error: 'Open the review link on the LEE website.' }, 403);
    if (!rateLimit('payment-review:' + clientIp(request), 15, 60000)) return privateJson({ error: 'Please wait a minute before trying again.' }, 429);
    const token = reviewerTokenSchema.safeParse(request.headers.get('authorization')?.replace(/^Bearer /, ''));
    if (!token.success) return privateJson({ error: 'Use the complete review link supplied by LEE.' }, 403);
    if (!customerCardEnabled() || !(await getPaymentMethods()).BANK_AUDI) return privateJson({ error: 'Sandbox checkout is temporarily unavailable.' }, 503);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return privateJson({ error: 'Send JSON.' }, 415);
    const input = schema.safeParse(await boundedJson(request, 1024));
    if (!input.success) return privateJson({ error: 'Invalid test request.' }, 400);
    return privateJson(await createReviewerOrder(token.data, input.data.requestId));
  } catch (error) {
    if (error instanceof ReviewerError) return privateJson({ error: error.message }, error.status);
    if (error instanceof InputTooLarge) return privateJson({ error: 'Request too large.' }, 413);
    if (error instanceof SyntaxError) return privateJson({ error: 'Invalid request.' }, 400);
    return privateJson({ error: 'Unable to prepare the test checkout. Please try again.' }, 503);
  }
}
