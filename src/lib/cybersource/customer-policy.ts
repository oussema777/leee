import { z } from 'zod';

export const cardTestSnapshotSchema = z.object({
  provider: z.literal('CYBERSOURCE'), environment: z.literal('TEST'), testMode: z.literal(true),
  amountCents: z.number().int().positive(), currency: z.literal('USD'), supportPhone: z.string(),
});
export function isCardSnapshot(value: unknown) { return cardTestSnapshotSchema.safeParse(value).success; }
export function isTestBookReference(reference: string) { return reference.startsWith('LEE-TEST-'); }
export function isTestEbookReference(reference: string) { return reference.startsWith('EB-TEST-CARD-'); }
