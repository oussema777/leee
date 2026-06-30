import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withSuperAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withSuperAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const item = await db.teamSubmission.findUnique({ where: { id } });
    if (!item) return errorResponse("Not found", 404);
    if (!item.isRead) {
      await db.teamSubmission.update({ where: { id }, data: { isRead: true } });
    }
    return NextResponse.json({ ...item, isRead: true });
  } catch {
    return errorResponse("Failed to fetch submission");
  }
}
