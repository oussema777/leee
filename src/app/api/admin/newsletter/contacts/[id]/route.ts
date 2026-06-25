import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await db.contact.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Failed to delete contact");
  }
}
