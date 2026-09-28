import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, withAdmin } from "@/lib/api-utils";
import { BOOK_VOLUNTEER_STATUSES } from "@/lib/book-restore/volunteer";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  const auth = await withAdmin(request); if ("error" in auth) return auth.error!;
  const { id } = await context.params;
  try {
    const item = await db.bookVolunteerSubmission.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json(item, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return errorResponse("Volunteer application not found", 404); }
}
export async function PATCH(request: NextRequest, context: Context) {
  const auth = await withAdmin(request); if ("error" in auth) return auth.error!;
  const { id } = await context.params;
  try {
    const body = await request.json();
    if (!body || !BOOK_VOLUNTEER_STATUSES.includes(body.status)) return errorResponse("Invalid status", 400);
    if (typeof body.adminNotes !== "string" || body.adminNotes.length > 5000) return errorResponse("Invalid notes", 400);
    if (typeof body.expectedUpdatedAt !== "string" || Number.isNaN(Date.parse(body.expectedUpdatedAt))) return errorResponse("Reload this application before saving", 400);
    const result = await db.bookVolunteerSubmission.updateMany({
      where: { id, updatedAt: new Date(body.expectedUpdatedAt) },
      data: { status: body.status, adminNotes: body.adminNotes.trim() || null, reviewedAt: new Date(), isRead: true },
    });
    if (result.count !== 1) return errorResponse("This application changed. Reload before saving.", 409);
    const item = await db.bookVolunteerSubmission.findUniqueOrThrow({ where: { id } });
    return NextResponse.json(item, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return errorResponse("Could not update volunteer application", 500); }
}
