import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, search, sort, order, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const pillarId = url.searchParams.get("pillarId");
    const status = url.searchParams.get("status");

    const where: any = {};
    if (search) where.OR = [{ titleEn: { contains: search, mode: "insensitive" } }, { titleAr: { contains: search } }];
    if (pillarId) where.pillarId = pillarId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      db.program.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
        include: { pillar: { select: { titleEn: true } } },
      }),
      db.program.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch programs");
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { images, teamMembers, partners, stats, videos, ...programData } = body;

    const program = await db.program.create({
      data: {
        ...programData,
        images: images?.length ? { create: images } : undefined,
        teamMembers: teamMembers?.length ? { create: teamMembers } : undefined,
        partners: partners?.length ? { create: partners } : undefined,
        stats: stats?.length ? { create: stats } : undefined,
        videos: videos?.length ? { create: videos } : undefined,
      },
      include: { images: true, teamMembers: true, partners: true, stats: true, videos: true },
    });
    return NextResponse.json(program, { status: 201 });
  } catch (err) {
    console.error(err);
    return errorResponse("Failed to create program");
  }
}
