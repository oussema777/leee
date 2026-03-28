import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const [stats, interventions] = await Promise.all([
      db.crisisStat.findMany({ orderBy: { order: "asc" } }),
      db.crisisIntervention.findMany({ orderBy: { order: "asc" } }),
    ]);
    return NextResponse.json({ stats, interventions });
  } catch { return errorResponse("Failed to fetch crisis data"); }
}

export async function PUT(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { stats, interventions } = await request.json();
    await db.$transaction(async (tx) => {
      await tx.crisisStat.deleteMany();
      await tx.crisisIntervention.deleteMany();
      if (stats?.length) await tx.crisisStat.createMany({ data: stats.map((s: any, i: number) => ({ ...s, id: undefined, order: i })) });
      if (interventions?.length) await tx.crisisIntervention.createMany({ data: interventions.map((v: any, i: number) => ({ ...v, id: undefined, order: i })) });
    });
    return NextResponse.json({ success: true });
  } catch { return errorResponse("Failed to update crisis data"); }
}
