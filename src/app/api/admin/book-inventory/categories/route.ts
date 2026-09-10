import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, withAdmin } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    const items = await db.bookInventoryItem.findMany({
      where: { customCategory: { not: null } },
      distinct: ['customCategory'],
      orderBy: { customCategory: 'asc' },
      select: { customCategory: true },
    });

    return NextResponse.json({
      data: items.flatMap((item) => item.customCategory ? [item.customCategory] : []),
    });
  } catch (error) {
    console.error('Book category options failed to load', error);
    return errorResponse('Failed to load book categories');
  }
}
