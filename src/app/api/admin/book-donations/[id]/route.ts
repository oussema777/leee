import { BookDonationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { errorResponse, withAdmin } from "@/lib/api-utils";
import { BOOK_DONATION_STATUSES } from "@/lib/book-restore/validation";

const updateSchema = z.object({
  status: z.enum(BOOK_DONATION_STATUSES).optional(),
  adminNotes: z.string().max(5000).optional(),
}).strict().refine((value) => value.status !== undefined || value.adminNotes !== undefined, { message: "Nothing to update" });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const item = await db.bookDonationSubmission.findUnique({ where: { id } });
    if (!item) return errorResponse("Not found", 404);
    if (!item.isRead) {
      return NextResponse.json(await db.bookDonationSubmission.update({ where: { id }, data: { isRead: true } }));
    }
    return NextResponse.json(item);
  } catch {
    return errorResponse("Failed to load book donation");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Invalid update", 400);

    const current = await db.bookDonationSubmission.findUnique({
      where: { id },
      select: { reviewedAt: true, status: true },
    });
    if (!current) return errorResponse("Not found", 404);

    const data: { status?: BookDonationStatus; adminNotes?: string; reviewedAt?: Date } = {};
    if (parsed.data.status !== undefined) data.status = parsed.data.status;
    if (parsed.data.adminNotes !== undefined) data.adminNotes = parsed.data.adminNotes.trim();
    if (data.status && data.status !== "NEW" && current.status === "NEW" && !current.reviewedAt) data.reviewedAt = new Date();

    return NextResponse.json(await db.bookDonationSubmission.update({ where: { id }, data }));
  } catch {
    return errorResponse("Failed to update book donation");
  }
}
