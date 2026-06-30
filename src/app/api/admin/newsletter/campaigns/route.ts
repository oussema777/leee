import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, skip } = getPaginationParams(request);
    const [data, total] = await Promise.all([
      db.campaign.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
      db.campaign.count(),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch campaigns");
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const campaign = await db.campaign.create({
      data: {
        subject: body.subject,
        html: body.html,
        locale: body.locale ?? "EN",
        targetTags: Array.isArray(body.targetTags) ? body.targetTags : [],
      },
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch {
    return errorResponse("Failed to create campaign");
  }
}
