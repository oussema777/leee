import { getPaymentMethods } from '@/lib/payment-methods';
import { liveCustomerEnabled } from '@/lib/cybersource/live-config';
import { NextRequest } from "next/server";
import { customerTestAccess } from "@/lib/cybersource/customer-config";
import { privateJson } from "@/lib/book-orders/whish-server";
export async function GET(request: NextRequest) {
  const enabled = (await getPaymentMethods()).BANK_AUDI;
  const live = enabled && liveCustomerEnabled(); const available = enabled && (live || await customerTestAccess(request));
  return privateJson({ available, testMode: available && !live });
}
