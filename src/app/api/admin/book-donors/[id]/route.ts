import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { errorResponse, withAdmin } from "@/lib/api-utils";
import { bookDonorAdminSchema } from "@/lib/book-restore/validation";

const clean = (value?: string) => value?.trim() || null;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const donor = await db.bookDonor.findUnique({ where: { id }, include: {
    donations: { orderBy: { createdAt: "desc" }, select: { id: true, reference: true, status: true, createdAt: true } },
    inventoryItems: { orderBy: { updatedAt: "desc" }, select: { id: true, sku: true, title: true, status: true } },
  } });
  return donor ? NextResponse.json(donor) : errorResponse("Donor not found", 404);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const parsed = bookDonorAdminSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Invalid donor", 400);
    const input = parsed.data;
    const donor = await db.bookDonor.update({ where: { id }, data: {
      ...input, displayName: clean(input.displayName) || "Anonymous donor", phone: clean(input.phone) || "", contactName: clean(input.contactName), email: clean(input.email)?.toLowerCase(), logoUrl: clean(input.logoUrl), adminNotes: clean(input.adminNotes),
      logoApproved: input.type === "ORGANISATION" && Boolean(input.logoUrl) && input.logoApproved,
    } });
    return NextResponse.json(donor);
  } catch (error: any) {
    if (error?.code === "P2025") return errorResponse("Donor not found", 404);
    return errorResponse("Failed to update donor");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  try {
    await db.bookDonor.delete({ where: { id }, select: { id: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return errorResponse("Donor not found", 404);
      if (error.code === "P2003") return errorResponse("This donor is still linked to a record and cannot be deleted.", 409);
    }
    console.error("Book donor deletion failed", error);
    return errorResponse("Failed to delete donor. Please try again.");
  }
}
