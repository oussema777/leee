import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { errorResponse, withAdmin } from '@/lib/api-utils';
import { bookInventorySchema, createInventorySlug } from '@/lib/book-inventory/validation';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ('error' in auth) return auth.error;
  const { id } = await params;

  try {
    const item = await db.bookInventoryItem.findUnique({
      where: { id },
      include: { sourceDonation: { select: { id: true, reference: true, fullName: true } } },
    });
    if (!item) return errorResponse('Not found', 404);
    return NextResponse.json(item);
  } catch {
    return errorResponse('Failed to load inventory item');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ('error' in auth) return auth.error;
  const { id } = await params;

  try {
    const existing = await db.bookInventoryItem.findUnique({
      where: { id },
      select: { id: true, slug: true, publishedAt: true },
    });
    if (!existing) return errorResponse('Not found', 404);

    const parsed = bookInventorySchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || 'Invalid inventory data', 400);
    const input = parsed.data;
    const { sku: _ignored, sourceDonationId, ...rest } = input;

    const duplicate = await db.bookInventoryItem.findFirst({
      where: {
        id: { not: id },
        ...(input.isbn
          ? {
              OR: [
                { title: { equals: input.title, mode: 'insensitive' as const } },
                { isbn: { equals: input.isbn, mode: 'insensitive' as const } },
              ],
            }
          : { title: { equals: input.title, mode: 'insensitive' as const } }),
      },
      select: { id: true },
    });
    if (duplicate) {
      return errorResponse('Book already exists. A book with the same title or ISBN is already in inventory.', 409);
    }

    if (sourceDonationId) {
      const donation = await db.bookDonationSubmission.findUnique({ where: { id: sourceDonationId }, select: { id: true } });
      if (!donation) return errorResponse('Source donation not found', 400);
    }

    const item = await db.bookInventoryItem.update({
      where: { id },
      data: {
        ...rest,
        sku: input.sku || '',
        slug: input.sku ? createInventorySlug(input.title, input.sku) : existing.slug,
        sourceDonationId: sourceDonationId || null,
        publishedAt: input.isPublished ? existing.publishedAt || new Date() : null,
      },
    });
    return NextResponse.json(item);
  } catch (error: any) {
    if (error?.code === 'P2002') return errorResponse('SKU or slug already exists', 409);
    console.error('Book inventory update failed', error);
    return errorResponse('Failed to update inventory item');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    // The order-item foreign key prevents deletion even if an order is created concurrently.
    await db.bookInventoryItem.delete({ where: { id }, select: { id: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return errorResponse('Book not found', 404);
      if (error.code === 'P2003') {
        return errorResponse('This book is linked to an order and cannot be deleted. Archive it instead to preserve order history.', 409);
      }
    }
    console.error('Book inventory deletion failed', error);
    return errorResponse('Failed to delete book. Please try again.');
  }
}
