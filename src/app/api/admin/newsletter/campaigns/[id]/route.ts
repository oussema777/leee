import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const item = await db.campaign.findUnique({ where: { id } });
    if (!item) return errorResponse("Not found", 404);
    return NextResponse.json(item);
  } catch { return errorResponse("Failed to fetch campaign"); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) return errorResponse("Campaign not found", 404);
    if (existing.status !== "DRAFT") return errorResponse("Only draft campaigns can be edited", 400);
    const body = await request.json();
    const data: Prisma.CampaignUpdateInput = {};
    if (body.subject !== undefined) data.subject = body.subject;
    if (body.html !== undefined) data.html = body.html;
    if (body.locale !== undefined) data.locale = body.locale;
    if (body.targetTags !== undefined) data.targetTags = body.targetTags;
    // Editing content clears the test-send gate.
    if (body.subject !== undefined || body.html !== undefined) data.lastTestedAt = null;
    const item = await db.campaign.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch { return errorResponse("Failed to update campaign"); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) return errorResponse("Campaign not found", 404);
    if (existing.status !== "DRAFT") return errorResponse("Only draft campaigns can be deleted", 400);
    await db.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return errorResponse("Failed to delete campaign"); }
}
