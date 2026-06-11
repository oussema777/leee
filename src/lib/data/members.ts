import { db } from "@/lib/db";

export type ShowcaseMember = {
  id: string;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  bioEn: string | null;
  bioAr: string | null;
  imageUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
};

/**
 * Active EXPERT and MENTOR members for the public "Our Experts & Mentors"
 * showcase on the About page, split by type and ordered by `order`.
 */
export type TeamMemberItem = {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  quoteEn: string;
  quoteAr: string;
  imageUrl: string;
};

/** Active TEAM members for the About page "Meet The Team" section. */
export async function getTeamMembers(): Promise<TeamMemberItem[]> {
  const rows = await db.boardMember.findMany({
    where: { isActive: true, memberType: "TEAM" },
    orderBy: { order: "asc" },
  });
  return rows.map((m) => ({
    id: m.id,
    nameEn: m.nameEn,
    nameAr: m.nameAr,
    roleEn: m.titleEn,
    roleAr: m.titleAr,
    quoteEn: m.quoteEn ?? "",
    quoteAr: m.quoteAr ?? "",
    imageUrl: m.imageUrl ?? "",
  }));
}

export async function getExpertsAndMentors(): Promise<{
  experts: ShowcaseMember[];
  mentors: ShowcaseMember[];
}> {
  const members = await db.boardMember.findMany({
    where: { isActive: true, memberType: { in: ["EXPERT", "MENTOR"] } },
    orderBy: { order: "asc" },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      titleEn: true,
      titleAr: true,
      bioEn: true,
      bioAr: true,
      imageUrl: true,
      linkedinUrl: true,
      twitterUrl: true,
      instagramUrl: true,
      websiteUrl: true,
      memberType: true,
    },
  });

  return {
    experts: members.filter((m) => m.memberType === "EXPERT"),
    mentors: members.filter((m) => m.memberType === "MENTOR"),
  };
}
