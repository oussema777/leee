import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, getPaginationParams, withAdmin } from '@/lib/api-utils';
import { normalizeBookCategory } from '@/lib/book-inventory/categories';
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
    const category = normalizeBookCategory(params.get('category') || '');
    const published = params.get('published');

    if (status && !BOOK_INVENTORY_STATUSES.includes(status as (typeof BOOK_INVENTORY_STATUSES)[number])) {
      return errorResponse('Invalid inventory status', 400);
    }
    if (category.length > 80) {
      return errorResponse('Invalid book category', 400);
    }

    const where: any = {
      ...(status ? { status } : {}),
      ...(category ? {
        AND: [{ OR: [
          { categories: { has: category } },
          {
            categories: { isEmpty: true },
            ...(BOOK_CATEGORIES.includes(category as (typeof BOOK_CATEGORIES)[number])
              ? { category }
              : { customCategory: { equals: category, mode: 'insensitive' } }),
          },
        ] }],
      } : {}),
      ...(published === 'true' || published === 'false' ? { isPublished: published === 'true' } : {}),
      ...(search
        ? {
            OR: [
              { sku: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { titleAr: { contains: search, mode: 'insensitive' } },
              { author: { contains: search, mode: 'insensitive' } },
              { editions: { some: { label: { contains: search, mode: 'insensitive' } } } },
              { isbn: { contains: search, mode: 'insensitive' } },
              { customCategory: { contains: search, mode: 'insensitive' } },
              { categories: { has: normalizeBookCategory(search) } },
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
          category: true, customCategory: true, categories: true, language: true, condition: true, priceCents: true, currency: true,
          stockQuantity: true, coverImageUrl: true, status: true, isPublished: true,
          editions: { where: { active: true }, select: { id: true, label: true, publicationYear: true, stockQuantity: true, coverImageUrl: true } },
          sourceDonation: { select: { reference: true } }, donor: { select: { id: true, displayName: true, type: true, logoUrl: true, logoApproved: true } }, updatedAt: true,
        },
      }),
      db.bookInventoryItem.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Book inventory load failed', error);
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
    const { sku: _ignored, sourceDonationId, donorId, editions, ...rest } = input;

    const duplicate = await db.bookInventoryItem.findFirst({
      where: input.isbn ? { OR: [{ title: { equals: input.title, mode: 'insensitive' } }, { isbn: { equals: input.isbn, mode: 'insensitive' } }] } : { title: { equals: input.title, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) {
      return errorResponse('This book title or ISBN is already in inventory. Add another edition to the existing book instead.', 409);
    }

    let resolvedDonorId = donorId || null;
    if (sourceDonationId) {
      const donation = await db.bookDonationSubmission.findUnique({
        where: { id: sourceDonationId },
        select: { id: true, donorId: true },
      });
      if (!donation) return errorResponse('Source donation not found', 400);
      resolvedDonorId ||= donation.donorId;
    }
    if (donorId) {
      const donor = await db.bookDonor.findFirst({ where: { id: donorId, active: true }, select: { id: true } });
      if (!donor) return errorResponse('Donor not found or inactive', 400);
    }

    const item = await db.bookInventoryItem.create({
      data: {
        ...rest,
        sku,
        slug: createInventorySlug(input.title, sku),
        sourceDonationId: sourceDonationId || null,
        donorId: resolvedDonorId,
        publishedAt: input.isPublished ? new Date() : null,
        editions: { create: editions.map(({ id: _id, ...edition }) => ({ ...edition, active: true })) },
      },
      include: { editions: { where: { active: true } } },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') return errorResponse('SKU or slug already exists', 409);
    console.error('Book inventory create failed', error);
    return errorResponse('Failed to create inventory item');
  }
}
