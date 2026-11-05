import { z } from 'zod';
export const whishSnapshotSchema = z.object({ provider: z.literal('WHISH_PAY'), environment: z.literal('SANDBOX'), testMode: z.literal(true), amountCents: z.number().int().min(100), currency: z.literal('USD'), supportPhone: z.string() });
export const liveWhishSnapshotSchema = z.object({ provider: z.literal('WHISH_PAY'), environment: z.literal('PRODUCTION'), testMode: z.literal(false), channel: z.string().min(1), amountCents: z.number().int().min(100), currency: z.literal('USD'), supportPhone: z.string(), stockReservation: z.enum(['HELD', 'NOT_REQUIRED']).optional() });
export const isLiveWhish = (value: unknown) => liveWhishSnapshotSchema.safeParse(value).success;
export const isHostedWhish = (value: unknown) => whishSnapshotSchema.safeParse(value).success || isLiveWhish(value);
export const whishSnapshot = (amountCents: number) => whishSnapshotSchema.parse({ provider: 'WHISH_PAY', environment: 'SANDBOX', testMode: true, amountCents, currency: 'USD', supportPhone: '9613600747' });
export const orderContextSchema = z.object({ kind: z.enum(['BOOK', 'EBOOK']), orderId: z.string(), reference: z.string(), amountCents: z.number().int().min(100), returnPath: z.string().regex(/^\/(en|ar)\/(books\/payment|ebooks\/orders)\/[A-Za-z0-9-]+$/) });
export type OrderContext = z.infer<typeof orderContextSchema>;
export function canRetryPayment(status: string, errorCode: string | null, uncertain: boolean) { return status === 'failed' || (!!errorCode && !uncertain && status !== 'success' && status !== 'refunded'); }
