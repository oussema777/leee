import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, withAdmin } from '@/lib/api-utils';
import { bookCategoryLabel, getBookCategories, normalizeBookCategories } from '@/lib/book-inventory/categories';

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    const items = await db.bookInventoryItem.findMany({
      select: { category: true, customCategory: true, categories: true },
    });

    return NextResponse.json({
      data: normalizeBookCategories(items.flatMap(getBookCategories))
        .sort((a, b) => bookCategoryLabel(a).localeCompare(bookCategoryLabel(b))),
    });
  } catch (error) {
    console.error('Book category options failed to load', error);
    return errorResponse('Failed to load book categories');
  }
}
