import { NextRequest } from 'next/server';
import { whishCustomerRoute } from '@/lib/whish-pay/customer-route';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return whishCustomerRoute(request, 'EBOOK', (await params).id); }
