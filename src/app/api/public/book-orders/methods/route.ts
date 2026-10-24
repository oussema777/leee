import { NextRequest } from 'next/server';
import { getPaymentMethods } from '@/lib/payment-methods';
import { getWhishConfig, privateJson } from '@/lib/book-orders/whish-server';
import { isWhishAvailable } from '@/lib/book-orders/whish-config';
import { liveCustomerEnabled } from '@/lib/cybersource/live-config';
import { customerTestAccess } from '@/lib/cybersource/customer-config';
export async function GET(request: NextRequest) {
  try {
    const methods = await getPaymentMethods();
    const live = methods.BANK_AUDI && liveCustomerEnabled();
    return privateJson({ methods: { CASH: methods.CASH, WHISH: methods.WHISH && isWhishAvailable(await getWhishConfig()), BANK_AUDI: methods.BANK_AUDI && (live || await customerTestAccess(request)) }, cardTestMode: !live });
  } catch { return privateJson({ error: 'Payment methods are temporarily unavailable.' }, 503); }
}
