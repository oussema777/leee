import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const data = await db.pillar.findMany({
      orderBy: { order: "asc" },
      include: {
        subPillars: { orderBy: { order: "asc" } },
        pillarInfos: { orderBy: { order: "asc" } },
      },
    });
    return NextResponse.json(data);
  } catch { return errorResponse("Failed to fetch pillars"); }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    const { subPillars, pillarInfos, ...pillarData } = body;
    const pillar = await db.pillar.create({
      data: {
        ...pillarData,
        subPillars: subPillars?.length ? { create: subPillars } : undefined,
        pillarInfos: pillarInfos?.length ? { create: pillarInfos } : undefined,
      },
      include: { subPillars: true, pillarInfos: true },
    });
    return NextResponse.json(pillar, { status: 201 });
  } catch { return errorResponse("Failed to create pillar"); }
}

export async function PUT(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    const { id, subPillars, pillarInfos, ...pillarData } = body;

    const pillar = await db.$transaction(async (tx) => {
      await tx.subPillar.deleteMany({ where: { pillarId: id } });
      await tx.pillarInfo.deleteMany({ where: { pillarId: id } });
      return tx.pillar.update({
        where: { id },
        data: {
          ...pillarData,
          subPillars: subPillars?.length ? { create: subPillars.map((s: any) => ({ titleEn: s.titleEn, titleAr: s.titleAr, bodyEn: s.bodyEn, bodyAr: s.bodyAr, order: s.order || 0 })) } : undefined,
          pillarInfos: pillarInfos?.length ? { create: pillarInfos.map((p: any) => ({ labelEn: p.labelEn, labelAr: p.labelAr, value: p.value, order: p.order || 0 })) } : undefined,
        },
        include: { subPillars: true, pillarInfos: true },
      });
    });

    return NextResponse.json(pillar);
  } catch { return errorResponse("Failed to update pillar"); }
}

export async function DELETE(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await request.json();
    await db.pillar.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return errorResponse("Failed to delete pillar"); }
}
