import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getPaymentMethodSettings, PAYMENT_METHOD_SETTINGS_ID, paymentMethodsSchema } from '@/lib/payment-methods';
import { privateJson, withPaymentAdmin } from '@/lib/book-orders/whish-server';
import { boundedJson, InputTooLarge } from '@/lib/cybersource/bounded-input';

const input = z.object({ methods: paymentMethodsSchema, version: z.string().datetime().nullable() }).strict();
export async function GET(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request); if ('error' in auth) return auth.error!;
    return privateJson(await getPaymentMethodSettings());
  } catch { return privateJson({ error: 'Could not load payment methods.' }, 503); }
}
export async function PUT(request: NextRequest) {
  try {
    const auth = await withPaymentAdmin(request); if ('error' in auth) return auth.error!;
    const origin = request.headers.get('origin');
    const local = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(request.nextUrl.hostname) && origin === request.nextUrl.origin;
    if (origin !== 'https://www.theleeexperience.com' && !local) return privateJson({ error: 'Open payment settings on the LEE website.' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return privateJson({ error: 'Send JSON.' }, 415);
    const parsed = input.safeParse(await boundedJson(request, 4096));
    if (!parsed.success) return privateJson({ error: 'Reload payment methods and try again.' }, 400);
    const saved = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('checkout-payment-methods'))::text`;
      const row = await tx.bookWhishSettings.findUnique({ where: { id: PAYMENT_METHOD_SETTINGS_ID } });
      if ((row?.updatedAt.toISOString() || null) !== parsed.data.version) throw Error('STALE_METHODS');
      return tx.bookWhishSettings.upsert({ where: { id: PAYMENT_METHOD_SETTINGS_ID },
        create: { id: PAYMENT_METHOD_SETTINGS_ID, config: parsed.data.methods, updatedBy: auth.session.userId },
        update: { config: parsed.data.methods, updatedBy: auth.session.userId } });
    });
    return privateJson({ methods: paymentMethodsSchema.parse(saved.config), version: saved.updatedAt.toISOString() });
  } catch (e) {
    if (e instanceof InputTooLarge) return privateJson({ error: 'Request too large.' }, 413);
    if (e instanceof SyntaxError) return privateJson({ error: 'Invalid JSON.' }, 400);
    if (e instanceof Error && e.message === 'STALE_METHODS') return privateJson({ error: 'Another administrator changed payment methods. Refresh before saving.' }, 409);
    return privateJson({ error: 'Could not save payment methods.' }, 503);
  }
}
