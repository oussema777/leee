import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const count = await db.testimonialSubmission.count({ where: { isRead: false } });
    return NextResponse.json({ count });
  } catch { return errorResponse("Failed to count"); }
}
