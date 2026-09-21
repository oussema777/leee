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
      include: {
        sourceDonation: { select: { id: true, reference: true, fullName: true } },
        donor: { select: { id: true, displayName: true, type: true } },
        donorAllocations: { where: { stockQuantity: { gt: 0 } }, include: { donor: { select: { id: true, displayName: true, type: true, phone: true } } }, orderBy: { createdAt: 'asc' } },
        editions: { where: { active: true }, orderBy: { createdAt: 'asc' } },
      },
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
    const { sku: _ignored, sourceDonationId, donorId, donorAllocations, editions, ...rest } = input;

    const duplicate = await db.bookInventoryItem.findFirst({
      where: {
        id: { not: id },
        ...(input.isbn ? { OR: [{ title: { equals: input.title, mode: 'insensitive' as const } }, { isbn: { equals: input.isbn, mode: 'insensitive' as const } }] } : { title: { equals: input.title, mode: 'insensitive' as const } }),
      },
      select: { id: true },
    });
    if (duplicate) {
      return errorResponse('This book title or ISBN is already in inventory. Add another edition to the existing book instead.', 409);
    }

    let resolvedDonorId = donorId || null;
    if (sourceDonationId) {
      const donation = await db.bookDonationSubmission.findUnique({ where: { id: sourceDonationId }, select: { id: true, donorId: true } });
      if (!donation) return errorResponse('Source donation not found', 400);
      resolvedDonorId ||= donation.donorId;
    }
    if (donorId) {
      const donor = await db.bookDonor.findUnique({ where: { id: donorId }, select: { id: true } });
      if (!donor) return errorResponse('Donor not found', 400);
    }
    const resolvedAllocations = donorAllocations.length
      ? donorAllocations
      : resolvedDonorId ? [{ donorId: resolvedDonorId, stockQuantity: input.stockQuantity }] : [];
    if (resolvedAllocations.length) {
      const activeDonors = await db.bookDonor.count({ where: { id: { in: resolvedAllocations.map((allocation) => allocation.donorId) }, active: true } });
      if (activeDonors !== resolvedAllocations.length) return errorResponse('One or more donors were not found or are inactive', 400);
    }

    const item = await db.$transaction(async (tx) => {
      const savedIds = editions.flatMap((edition) => edition.id ? [edition.id] : []);
      if (savedIds.length) {
        const owned = await tx.bookInventoryEdition.count({ where: { inventoryItemId: id, id: { in: savedIds } } });
        if (owned !== savedIds.length) throw Error('INVALID_EDITION');
      }
      await tx.bookInventoryEdition.updateMany({ where: { inventoryItemId: id, ...(savedIds.length ? { id: { notIn: savedIds } } : {}) }, data: { active: false, stockQuantity: 0 } });
      for (const edition of editions) {
        const { id: editionId, ...data } = edition;
        if (editionId) await tx.bookInventoryEdition.update({ where: { id: editionId }, data: { ...data, active: true } });
        else await tx.bookInventoryEdition.create({ data: { ...data, active: true, inventoryItemId: id } });
      }
      const allocatedDonorIds = resolvedAllocations.map((allocation) => allocation.donorId);
      await tx.bookInventoryDonorAllocation.updateMany({
        where: { inventoryItemId: id, ...(allocatedDonorIds.length ? { donorId: { notIn: allocatedDonorIds } } : {}) },
        data: { stockQuantity: 0 },
      });
      for (const allocation of resolvedAllocations) {
        await tx.bookInventoryDonorAllocation.upsert({
          where: { inventoryItemId_donorId: { inventoryItemId: id, donorId: allocation.donorId } },
          create: { inventoryItemId: id, donorId: allocation.donorId, stockQuantity: allocation.stockQuantity },
          update: { stockQuantity: allocation.stockQuantity },
        });
      }
      return tx.bookInventoryItem.update({
        where: { id }, data: { ...rest, sku: input.sku || '', slug: input.sku ? createInventorySlug(input.title, input.sku) : existing.slug,
          sourceDonationId: sourceDonationId || null, donorId: resolvedAllocations[0]?.donorId || resolvedDonorId, publishedAt: input.isPublished ? existing.publishedAt || new Date() : null },
        include: { editions: { where: { active: true }, orderBy: { createdAt: 'asc' } }, donorAllocations: { include: { donor: true } } },
      });
    });
    return NextResponse.json(item);
  } catch (error: any) {
    if (error?.message === 'INVALID_EDITION') return errorResponse('One of the editions does not belong to this book.', 400);
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
