import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const item = await db.report.findUnique({ where: { id } });
    if (!item) return errorResponse("Not found", 404);
    return NextResponse.json(item);
  } catch { return errorResponse("Failed to fetch report"); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const body = await request.json();
    const item = await db.report.update({ where: { id }, data: body });
    return NextResponse.json(item);
  } catch { return errorResponse("Failed to update report"); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await db.report.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return errorResponse("Failed to delete report"); }
}
