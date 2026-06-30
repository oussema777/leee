import type { CleanSubmission } from "./validation";

type SecondLang = { name: string; title: string };
type SubmissionLike = Omit<
  CleanSubmission,
  "linkedinUrl" | "twitterUrl" | "instagramUrl" | "websiteUrl"
> & {
  twitterUrl?: string | null; instagramUrl?: string | null;
  websiteUrl?: string | null; linkedinUrl?: string | null;
};

export function buildBoardMemberData(
  submission: SubmissionLike,
  secondLang: SecondLang,
  maxTeamOrder: number
) {
  const en = submission.locale === "en"
    ? { name: submission.name, title: submission.title }
    : { name: secondLang.name, title: secondLang.title };
  const ar = submission.locale === "ar"
    ? { name: submission.name, title: submission.title }
    : { name: secondLang.name, title: secondLang.title };

  return {
    nameEn: en.name, nameAr: ar.name,
    titleEn: en.title, titleAr: ar.title,
    imageUrl: submission.photoUrl ?? null,
    linkedinUrl: submission.linkedinUrl ?? null,
    twitterUrl: submission.twitterUrl ?? null,
    instagramUrl: submission.instagramUrl ?? null,
    websiteUrl: submission.websiteUrl ?? null,
    memberType: "TEAM" as const,
    isActive: true,
    order: maxTeamOrder + 1,
  };
}
