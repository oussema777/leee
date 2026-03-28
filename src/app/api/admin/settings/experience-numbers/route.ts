import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const data = await db.experienceNumber.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(data);
  } catch { return errorResponse("Failed to fetch experience numbers"); }
}

export async function PUT(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const items: any[] = await request.json();
    await db.$transaction(async (tx) => {
      await tx.experienceNumber.deleteMany();
      if (items.length > 0) {
        await tx.experienceNumber.createMany({ data: items.map((item, i) => ({ ...item, id: undefined, order: i })) });
      }
    });
    const data = await db.experienceNumber.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(data);
  } catch { return errorResponse("Failed to update experience numbers"); }
}
