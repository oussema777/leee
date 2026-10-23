import { testCredentials } from './test-session-request';
import { NextRequest } from 'next/server';
import { withPaymentAdmin } from '@/lib/book-orders/whish-server';
export { isCardSnapshot } from './customer-policy';

export function customerCardEnabled() {
  if (process.env.CYBERSOURCE_CUSTOMER_TEST_ENABLED !== 'true') return false;
  try { testCredentials(); return (process.env.JWT_SECRET?.length ?? 0) >= 32; } catch { return false; }
}
export function cardSnapshot(amountCents: number) {
  if (!customerCardEnabled()) return null;
  return { provider: 'CYBERSOURCE', environment: 'TEST', testMode: true, amountCents, currency: 'USD', supportPhone: '9613600747' };
}
export async function customerTestAccess(request: NextRequest) {
  if (!customerCardEnabled() || !request.cookies.get('admin-token')?.value) return false;
  const auth = await withPaymentAdmin(request);
  return !('error' in auth);
}
