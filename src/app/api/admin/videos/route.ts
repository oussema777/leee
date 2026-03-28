import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, search, sort, order, skip } = getPaginationParams(request);
    const where = search
      ? { OR: [{ titleEn: { contains: search, mode: "insensitive" as const } }] }
      : {};

    const [data, total] = await Promise.all([
      db.video.findMany({ where, orderBy: { [sort === "createdAt" ? "order" : sort]: order }, skip, take: limit }),
      db.video.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch videos");
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const video = await db.video.create({ data: body });
    return NextResponse.json(video, { status: 201 });
  } catch {
    return errorResponse("Failed to create video");
  }
}
