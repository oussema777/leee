import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    const slider = await db.slider.findUnique({ where: { id } });
    if (!slider) return errorResponse("Slider not found", 404);
    return NextResponse.json(slider);
  } catch {
    return errorResponse("Failed to fetch slider");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    const body = await request.json();
    const slider = await db.slider.update({ where: { id }, data: body });
    return NextResponse.json(slider);
  } catch {
    return errorResponse("Failed to update slider");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    await db.slider.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Failed to delete slider");
  }
}
