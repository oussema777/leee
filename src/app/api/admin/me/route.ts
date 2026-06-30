import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ role: auth.session.role });
}
