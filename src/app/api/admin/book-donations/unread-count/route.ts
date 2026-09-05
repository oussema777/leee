import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, withAdmin } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    return NextResponse.json({ count: await db.bookDonationSubmission.count({ where: { isRead: false } }) });
  } catch {
    return errorResponse("Failed to count book donations");
  }
}
