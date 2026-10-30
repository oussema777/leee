import { NextRequest } from 'next/server';
import { whishCustomerAccess } from '@/lib/whish-pay/customer-config';
import { getPaymentMethods } from '@/lib/payment-methods';
import { getWhishConfig, privateJson } from '@/lib/book-orders/whish-server';
import { isWhishAvailable } from '@/lib/book-orders/whish-config';
import { liveCustomerEnabled } from '@/lib/cybersource/live-config';
import { customerTestAccess } from '@/lib/cybersource/customer-config';
export async function GET(request: NextRequest) {
  try {
    const methods = await getPaymentMethods();
    const live = methods.BANK_AUDI && liveCustomerEnabled();
    const whishTestMode = await whishCustomerAccess(request);
    return privateJson({ methods: { CASH: methods.CASH, WHISH: whishTestMode || methods.WHISH && isWhishAvailable(await getWhishConfig()), BANK_AUDI: methods.BANK_AUDI && (live || await customerTestAccess(request)) }, whishTestMode, cardTestMode: !live });
  } catch { return privateJson({ error: 'Payment methods are temporarily unavailable.' }, 503); }
}
