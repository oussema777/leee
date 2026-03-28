import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const item = await db.serviceRequest.findUnique({ where: { id } });
    if (!item) return errorResponse("Not found", 404);
    return NextResponse.json(item);
  } catch { return errorResponse("Failed to fetch service request"); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await db.serviceRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return errorResponse("Failed to delete service request"); }
}
