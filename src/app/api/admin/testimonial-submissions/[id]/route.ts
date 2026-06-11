import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const item = await db.testimonialSubmission.findUnique({ where: { id } });
    if (!item) return errorResponse("Not found", 404);
    return NextResponse.json(item);
  } catch { return errorResponse("Failed to fetch submission"); }
}

// Accepts { isRead?: boolean, status?: "REJECTED" }.
// APPROVED is set only by the testimonial-create transaction (see admin/testimonials POST).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const data: { isRead?: boolean; status?: "REJECTED"; reviewedAt?: Date } = {};
    if (typeof body.isRead === "boolean") data.isRead = body.isRead;
    if (body.status === "REJECTED") {
      data.status = "REJECTED";
      data.reviewedAt = new Date();
    }
    if (Object.keys(data).length === 0) return errorResponse("Nothing to update", 400);
    const item = await db.testimonialSubmission.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch { return errorResponse("Failed to update submission"); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await db.testimonialSubmission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return errorResponse("Failed to delete submission"); }
}
