import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, search, sort, order, skip } = getPaginationParams(request);
    const where = search
      ? { OR: [{ titleEn: { contains: search, mode: "insensitive" as const } }, { titleAr: { contains: search } }] }
      : {};

    const [data, total] = await Promise.all([
      db.blogPost.findMany({ where, orderBy: { [sort]: order }, skip, take: limit }),
      db.blogPost.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch blog posts");
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const post = await db.blogPost.create({ data: body });
    return NextResponse.json(post, { status: 201 });
  } catch {
    return errorResponse("Failed to create blog post");
  }
}
