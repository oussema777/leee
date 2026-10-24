import { NextRequest } from 'next/server';
import { liveCustomerCheckout } from '@/lib/cybersource/live-customer-route';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return liveCustomerCheckout(request, 'EBOOK', (await params).id);
}
