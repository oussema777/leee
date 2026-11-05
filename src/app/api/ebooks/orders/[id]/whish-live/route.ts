import { NextRequest } from 'next/server';
import { liveWhishRoute } from '@/lib/whish-pay/live-route';
export const runtime = 'nodejs';
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return liveWhishRoute(request, 'EBOOK', (await context.params).id);
}
