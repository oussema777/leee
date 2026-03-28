import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const data = await db.aboutContent.findMany({ orderBy: { section: "asc" } });
    return NextResponse.json(data);
  } catch { return errorResponse("Failed to fetch about content"); }
}

export async function PUT(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const items: any[] = await request.json();
    const results = await Promise.all(
      items.map((item) =>
        db.aboutContent.upsert({
          where: { section: item.section },
          create: item,
          update: { titleEn: item.titleEn, titleAr: item.titleAr, bodyEn: item.bodyEn, bodyAr: item.bodyAr, imageUrl: item.imageUrl },
        })
      )
    );
    return NextResponse.json(results);
  } catch { return errorResponse("Failed to update about content"); }
}
