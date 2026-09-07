import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, getPaginationParams, withAdmin } from '@/lib/api-utils';
import {
  BOOK_CATEGORIES,
  BOOK_INVENTORY_STATUSES,
  bookInventorySchema,
  createInventorySku,
  createInventorySlug,
} from '@/lib/book-inventory/validation';

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    const { page, limit, search, skip } = getPaginationParams(request);
    const params = new URL(request.url).searchParams;
    const status = params.get('status') || '';
    const category = params.get('category') || '';
    const published = params.get('published');

    if (status && !BOOK_INVENTORY_STATUSES.includes(status as (typeof BOOK_INVENTORY_STATUSES)[number])) {
      return errorResponse('Invalid inventory status', 400);
    }
    if (category && !BOOK_CATEGORIES.includes(category as (typeof BOOK_CATEGORIES)[number])) {
      return errorResponse('Invalid book category', 400);
    }

    const where: any = {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(published === 'true' || published === 'false' ? { isPublished: published === 'true' } : {}),
      ...(search
        ? {
            OR: [
              { sku: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { titleAr: { contains: search, mode: 'insensitive' } },
              { author: { contains: search, mode: 'insensitive' } },
              { isbn: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      db.bookInventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, sku: true, slug: true, title: true, titleAr: true, author: true,
          category: true, language: true, condition: true, priceCents: true, currency: true,
          stockQuantity: true, coverImageUrl: true, status: true, isPublished: true,
          sourceDonation: { select: { reference: true } }, updatedAt: true,
        },
      }),
      db.bookInventoryItem.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse('Failed to load book inventory');
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    const parsed = bookInventorySchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || 'Invalid inventory data', 400);

    const input = parsed.data;
    const sku = input.sku || createInventorySku();
    const { sku: _ignored, sourceDonationId, ...rest } = input;

    if (sourceDonationId) {
      const donation = await db.bookDonationSubmission.findUnique({
        where: { id: sourceDonationId },
        select: { id: true },
      });
      if (!donation) return errorResponse('Source donation not found', 400);
    }

    const item = await db.bookInventoryItem.create({
      data: {
        ...rest,
        sku,
        slug: createInventorySlug(input.title, sku),
        sourceDonationId: sourceDonationId || null,
        publishedAt: input.isPublished ? new Date() : null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') return errorResponse('SKU or slug already exists', 409);
    console.error('Book inventory create failed', error);
    return errorResponse('Failed to create inventory item');
  }
}
