import { NextRequest } from 'next/server';
import { withPaymentAdmin } from '@/lib/book-orders/whish-server';
import { sandboxConfig } from './client';
export async function whishCustomerAccess(request: NextRequest) {
  if (process.env.WHISH_PAY_CUSTOMER_TEST_ENABLED !== 'true' || !request.cookies.get('admin-token')?.value) return false;
  try { sandboxConfig(); } catch { return false; }
  return !('error' in await withPaymentAdmin(request));
}
