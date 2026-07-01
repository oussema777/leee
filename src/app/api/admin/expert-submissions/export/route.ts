import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin } from "@/lib/api-utils";
import { buildExpertCsv } from "@/lib/experts/csv";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const rows = await db.expertSubmission.findMany({ orderBy: { createdAt: "desc" } });
  const csv = buildExpertCsv(rows as unknown as Record<string, unknown>[]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expert-applications.csv"`,
    },
  });
}
