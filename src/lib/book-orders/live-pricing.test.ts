import { describe, expect, it, vi } from 'vitest';
vi.mock('./whish-server', () => ({ tokenHash: () => 'token-hash', requestHash: () => 'request-hash' }));
import { createLiveWhishBookOrder } from '@/lib/whish-pay/live-book-order';
import { createLiveBookOrder } from '@/lib/cybersource/live-book-order';

const providers = [
  { name: 'Whish', create: createLiveWhishBookOrder, method: 'WHISH', provider: 'WHISH_PAY',
    env: { WHISH_PAY_LIVE_ENABLED: 'true', WHISH_PAY_LIVE_CHANNEL: 'test-channel', WHISH_PAY_LIVE_SECRET: 'fixture', WHISH_PAY_LIVE_WEBSITE_URL: 'theleeexperience.com', WHISH_PAY_LIVE_PUBLIC_ORIGIN: 'https://www.theleeexperience.com' }, identity: { channel: 'test-channel' } },
  { name: 'Audi', create: createLiveBookOrder, method: 'BANK_AUDI', provider: 'CYBERSOURCE',
    env: { CYBERSOURCE_LIVE_ORDER_CREATION_ENABLED: 'true', CYBERSOURCE_LIVE_MERCHANT_ID: 'test-merchant' }, identity: { merchantId: 'test-merchant' } },
];
const packages = [
  ['SINGLE', 1, 900, 0], ['FIVE', 5, 4500, 0], ['TEN_PLUS_ONE', 11, 9000, 1], ['TWENTY_PLUS_TWO', 22, 18000, 2],
] as const;
function fixture(method: string, pack: string, count: number, fulfillment: string) {
  const ids = Array.from({ length: count }, (_, i) => `book-${i}`);
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: 'existing-attempt' }]), $executeRaw: vi.fn().mockResolvedValue(1),
    bookWhishPayment: { findUnique: vi.fn().mockResolvedValue(null) },
    bookInventoryItem: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    bookInventoryEdition: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    bookInventoryDonorAllocation: { findFirst: vi.fn().mockResolvedValue(null) },
    bookOrder: { create: vi.fn().mockResolvedValue({ id: 'new-order' }) },
  };
  const db = { $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as any;
  const input = { locale: 'en', package: pack, purpose: fulfillment === 'LEE_DISTRIBUTION' ? 'DONATION' : 'SELF',
    selectionMode: 'CUSTOM', selectedBookIds: ids, selectedEditions: ids.map(bookId => ({ bookId, editionId: `edition-${bookId}` })),
    customerName: 'Test purchaser', customerPhone: '70123456', paymentMethod: method, fulfillmentMethod: fulfillment,
    governorate: 'BEIRUT', area: 'Beirut', detailedAddress: 'Test address', paymentAccessToken: 'ab'.repeat(32), termsAccepted: true,
    priceCents: 500, amountCents: 1 };
  return { tx, db, input };
}
for (const provider of providers) describe(`${provider.name} physical book repricing`, () => {
  for (const [pack, count, subtotal, extras] of packages) it.each(['PICKUP', 'DELIVERY', 'LEE_DISTRIBUTION'])(`${pack} / %s uses the new server price`, async fulfillment => {
    const { tx, db, input } = fixture(provider.method, pack, count, fulfillment);
    const delivery = pack === 'SINGLE' && fulfillment === 'DELIVERY' ? 400 : 0;
    const result = await provider.create(db, input, provider.env);
    const saved = tx.bookOrder.create.mock.calls[0][0].data;
    expect(result.amountCents).toBe(subtotal + delivery);
    expect(saved).toMatchObject({ priceCents: subtotal + delivery, deliveryFeeCents: delivery, requestedBookCount: count });
    expect(saved.whishPayment.create.snapshot.amountCents).toBe(subtotal + delivery);
    expect(saved.items.create.filter((item: { isFreeExtra: boolean }) => item.isFreeExtra)).toHaveLength(extras);
  });
  it('resumes a previously saved $5 order without repricing or reserving stock again', async () => {
    const { tx, db, input } = fixture(provider.method, 'SINGLE', 1, 'PICKUP');
    tx.bookWhishPayment.findUnique.mockResolvedValue({ orderId: 'old-order', requestHash: 'request-hash', expiresAt: new Date(),
      order: { reference: 'OLD-ORDER', priceCents: 500 }, snapshot: { provider: provider.provider, environment: 'PRODUCTION', testMode: false, ...provider.identity } });
    expect(await provider.create(db, input, provider.env)).toMatchObject({ id: 'old-order', amountCents: 500 });
    expect(tx.bookOrder.create).not.toHaveBeenCalled();
    expect(tx.bookInventoryEdition.updateMany).not.toHaveBeenCalled();
  });
});
