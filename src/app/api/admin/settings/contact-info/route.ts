import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const data = await db.contactInfo.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json(data);
  } catch { return errorResponse("Failed to fetch contact info"); }
}

export async function PUT(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const items: { key: string; valueEn: string; valueAr?: string }[] = await request.json();
    const results = await Promise.all(
      items.map((item) =>
        db.contactInfo.upsert({
          where: { key: item.key },
          create: { key: item.key, valueEn: item.valueEn, valueAr: item.valueAr },
          update: { valueEn: item.valueEn, valueAr: item.valueAr },
        })
      )
    );
    return NextResponse.json(results);
  } catch { return errorResponse("Failed to update contact info"); }
}
