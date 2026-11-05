import { NextRequest } from 'next/server';
import { liveWhishRoute } from '@/lib/whish-pay/live-route';
export const runtime = 'nodejs';
export async function POST(request: NextRequest, context: { params: Promise<{ reference: string }> }) {
  return liveWhishRoute(request, 'BOOK', (await context.params).reference);
}
