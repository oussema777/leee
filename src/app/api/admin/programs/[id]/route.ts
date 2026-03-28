import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const program = await db.program.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        teamMembers: { orderBy: { order: "asc" } },
        partners: { orderBy: { order: "asc" } },
        stats: { orderBy: { order: "asc" } },
        videos: { orderBy: { order: "asc" } },
      },
    });
    if (!program) return errorResponse("Not found", 404);
    return NextResponse.json(program);
  } catch { return errorResponse("Failed to fetch program"); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  try {
    const body = await request.json();
    const { images, teamMembers, partners, stats, videos, ...programData } = body;

    // Use a transaction to replace all nested records
    const program = await db.$transaction(async (tx) => {
      // Delete existing nested records
      await Promise.all([
        tx.programImage.deleteMany({ where: { programId: id } }),
        tx.programTeamMember.deleteMany({ where: { programId: id } }),
        tx.programPartner.deleteMany({ where: { programId: id } }),
        tx.programStat.deleteMany({ where: { programId: id } }),
        tx.programVideo.deleteMany({ where: { programId: id } }),
      ]);

      // Update program with new nested records
      return tx.program.update({
        where: { id },
        data: {
          ...programData,
          images: images?.length ? { create: images.map((i: any) => ({ imageUrl: i.imageUrl, caption: i.caption, order: i.order || 0 })) } : undefined,
          teamMembers: teamMembers?.length ? { create: teamMembers.map((t: any) => ({ nameEn: t.nameEn, nameAr: t.nameAr, roleEn: t.roleEn, roleAr: t.roleAr, imageUrl: t.imageUrl, linkedinUrl: t.linkedinUrl, order: t.order || 0 })) } : undefined,
          partners: partners?.length ? { create: partners.map((p: any) => ({ nameEn: p.nameEn, nameAr: p.nameAr, logoUrl: p.logoUrl, websiteUrl: p.websiteUrl, order: p.order || 0 })) } : undefined,
          stats: stats?.length ? { create: stats.map((s: any) => ({ labelEn: s.labelEn, labelAr: s.labelAr, value: s.value, suffix: s.suffix, icon: s.icon, order: s.order || 0 })) } : undefined,
          videos: videos?.length ? { create: videos.map((v: any) => ({ titleEn: v.titleEn, titleAr: v.titleAr, youtubeUrl: v.youtubeUrl, order: v.order || 0 })) } : undefined,
        },
        include: { images: true, teamMembers: true, partners: true, stats: true, videos: true },
      });
    });

    return NextResponse.json(program);
  } catch (err) {
    console.error(err);
    return errorResponse("Failed to update program");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await db.program.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return errorResponse("Failed to delete program"); }
}
