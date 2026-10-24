import { z } from 'zod';
import { db } from '@/lib/db';

export const PAYMENT_METHOD_SETTINGS_ID = 'checkout-payment-methods';
export const paymentMethodsSchema = z.object({ WHISH: z.boolean(), BANK_AUDI: z.boolean(), CASH: z.boolean() }).strict();
export type PaymentMethods = z.infer<typeof paymentMethodsSchema>;
// First use starts with Whish hidden. Provider readiness remains a separate gate.
export const defaultPaymentMethods: PaymentMethods = { WHISH: false, BANK_AUDI: true, CASH: true };
export async function getPaymentMethodSettings() {
  const row = await db.bookWhishSettings.findUnique({ where: { id: PAYMENT_METHOD_SETTINGS_ID } });
  return { methods: row ? paymentMethodsSchema.parse(row.config) : { ...defaultPaymentMethods }, version: row?.updatedAt.toISOString() || null };
}
export async function getPaymentMethods() { return (await getPaymentMethodSettings()).methods; }
export function methodAllowed(methods: PaymentMethods, method: string) {
  return method === 'WHISH' ? methods.WHISH : method === 'BANK_AUDI' ? methods.BANK_AUDI : ['CASH_ON_DELIVERY', 'CASH_ARRANGEMENT', 'CASH'].includes(method) && methods.CASH;
}
