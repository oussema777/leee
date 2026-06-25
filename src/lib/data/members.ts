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
 * Active TEAM members for the About page "Meet The Team" section.
 * Returns the same `ShowcaseMember` shape as the experts/mentors showcase so
 * the team renders with the identical profile-card component. Members have no
 * separate bio, so their quote fills the card's description slot.
 */
export async function getTeamMembers(): Promise<ShowcaseMember[]> {
  const rows = await db.boardMember.findMany({
    where: { isActive: true, memberType: "TEAM" },
    orderBy: { order: "asc" },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      titleEn: true,
      titleAr: true,
      bioEn: true,
      bioAr: true,
      quoteEn: true,
      quoteAr: true,
      imageUrl: true,
      linkedinUrl: true,
      twitterUrl: true,
      instagramUrl: true,
      websiteUrl: true,
    },
  });
  return rows.map((m) => ({
    id: m.id,
    nameEn: m.nameEn,
    nameAr: m.nameAr,
    titleEn: m.titleEn,
    titleAr: m.titleAr,
    bioEn: m.bioEn || m.quoteEn || null,
    bioAr: m.bioAr || m.quoteAr || null,
    imageUrl: m.imageUrl,
    linkedinUrl: m.linkedinUrl,
    twitterUrl: m.twitterUrl,
    instagramUrl: m.instagramUrl,
    websiteUrl: m.websiteUrl,
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
