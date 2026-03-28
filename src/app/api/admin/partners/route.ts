import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, search, sort, order, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const partnerType = url.searchParams.get("type");

    const where: any = {};
    if (search) where.OR = [{ nameEn: { contains: search, mode: "insensitive" } }];
    if (partnerType) where.type = partnerType;

    const [data, total] = await Promise.all([
      db.partner.findMany({ where, orderBy: { [sort === "createdAt" ? "order" : sort]: order }, skip, take: limit }),
      db.partner.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch partners");
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const partner = await db.partner.create({ data: body });
    return NextResponse.json(partner, { status: 201 });
  } catch {
    return errorResponse("Failed to create partner");
  }
}
