import { NextRequest } from 'next/server';
import { z } from 'zod';
import { privateJson, withPaymentAdmin } from '@/lib/book-orders/whish-server';
import { boundedJson, InputTooLarge } from '@/lib/cybersource/bounded-input';
import { rateLimit } from '@/lib/rate-limit';
import { sandboxConfig, WhishError, whishClient } from '@/lib/whish-pay/client';
import { attemptIdSchema, checkAttempt, listAttempts, startAttempt } from '@/lib/whish-pay/sandbox';
export const runtime = 'nodejs';
export const maxDuration = 60;
const inputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('connection') }).strict(),
  z.object({ action: z.literal('start'), id: attemptIdSchema }).strict(),
  z.object({ action: z.literal('check'), id: attemptIdSchema }).strict(),
]);
function failure(error: unknown) {
  if (error instanceof InputTooLarge) return privateJson({ error: 'Request too large.' }, 413);
  if (error instanceof SyntaxError || error instanceof z.ZodError) return privateJson({ error: 'Invalid request.' }, 400);
  if (error instanceof WhishError) return privateJson({ error: 'Whish sandbox: ' + error.code, uncertain: error.uncertain }, 503);
  return privateJson({ error: 'Unable to complete the test. Refresh the saved attempts before retrying.' }, 503);
}
export async function GET(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request); if ('error' in auth) return auth.error!;
    let configured = true; let configurationError: string | null = null;
    try { sandboxConfig(); } catch (error) { configured = false; configurationError = error instanceof WhishError ? error.code : 'CONFIGURATION_REQUIRED'; }
    return privateJson({ configured, configurationError, attempts: await listAttempts() });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request); if ('error' in auth) return auth.error!;
    if (request.headers.get('origin') !== new URL(request.url).origin) return privateJson({ error: 'Reload this page before trying again.' }, 403);
    if (!rateLimit('whish-sandbox:' + auth.session.userId, 20, 60000)) return privateJson({ error: 'Wait a minute before checking again.' }, 429);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return privateJson({ error: 'Send JSON.' }, 415);
    const input = inputSchema.parse(await boundedJson(request, 2048));
    sandboxConfig();
    if (input.action === 'connection') return privateJson(await whishClient(sandboxConfig()).balance());
    return privateJson({ attempt: input.action === 'start' ? await startAttempt(input.id, auth.session.userId) : await checkAttempt(input.id) });
  } catch (error) { return failure(error); }
}
