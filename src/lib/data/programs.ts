import { db } from "@/lib/db";
import type { ProgramStatus } from "@prisma/client";

export type ProgramFilters = {
  status?: ProgramStatus;
  year?: number;
  pillarId?: string;
};

const pillarSelect = { select: { id: true, slug: true, titleEn: true, titleAr: true } } as const;

export async function getPrograms(filters?: ProgramFilters) {
  const where: Record<string, unknown> = { isActive: true };

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.year) {
    where.year = filters.year;
  }
  if (filters?.pillarId) {
    where.pillarId = filters.pillarId;
  }

  return db.program.findMany({
    where,
    include: {
      pillar: pillarSelect,
    },
    orderBy: [{ isFeatured: "desc" }, { year: "desc" }, { createdAt: "desc" }],
  });
}

export async function getProgramBySlug(slug: string) {
  return db.program.findUnique({
    where: { slug },
    include: {
      pillar: pillarSelect,
      images: { orderBy: { order: "asc" } },
      stats: { orderBy: { order: "asc" } },
      teamMembers: { orderBy: { order: "asc" } },
      partners: { orderBy: { order: "asc" } },
      videos: { orderBy: { order: "asc" } },
    },
  });
}

export async function getProgramFilterOptions() {
  const [years, pillars, statuses] = await Promise.all([
    db.program.findMany({
      where: { isActive: true, year: { not: null } },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
    db.pillar.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, titleEn: true, titleAr: true },
      orderBy: { order: "asc" },
    }),
    db.program.findMany({
      where: { isActive: true },
      select: { status: true },
      distinct: ["status"],
    }),
  ]);

  return {
    years: years.map((y) => y.year).filter(Boolean) as number[],
    pillars,
    statuses: statuses.map((s) => s.status),
  };
}

export async function getRelatedPrograms(programId: string, pillarId?: string | null, limit = 3) {
  return db.program.findMany({
    where: {
      isActive: true,
      id: { not: programId },
      ...(pillarId ? { pillarId } : {}),
    },
    include: {
      pillar: pillarSelect,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getFeaturedPrograms(limit = 6) {
  return db.program.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      pillar: pillarSelect,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
