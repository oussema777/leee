import { NextRequest } from 'next/server';
import { liveCustomerCheckout } from '@/lib/cybersource/live-customer-route';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  return liveCustomerCheckout(request, 'BOOK', (await params).reference);
}
