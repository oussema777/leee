import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withSuperAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withSuperAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const count = await db.teamSubmission.count({ where: { isRead: false } });
    return NextResponse.json({ count });
  } catch {
    return errorResponse("Failed to count");
  }
}
