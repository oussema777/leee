import { NextRequest } from 'next/server';
import { customerCheckout } from '@/lib/cybersource/customer-route';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return customerCheckout(request, 'EBOOK', (await params).id);
}
