import { notFound } from "next/navigation";
import { ProgramPage } from "@/components/sections/programs/ProgramPage";
import { getProgramBySlug } from "@/lib/data/programs";
import { buildPageMetadata } from "@/lib/metadata";
import { JsonLd } from "@/components/shared/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) return { title: "Program Not Found" };

  const title = locale === "ar" ? program.titleAr : program.titleEn;
  const summary = locale === "ar" ? program.summaryAr : program.summaryEn;
  const pillarName = program.pillar
    ? locale === "ar" ? program.pillar.titleAr : program.pillar.titleEn
    : "";
  const locationStr = locale === "ar"
    ? program.locationAr || program.locationEn || ""
    : program.locationEn || "";
  const base = buildPageMetadata({
    title,
    description: summary || "",
    path: `programs/${slug}`,
    locale,
    ogImage: program.coverImageUrl || undefined,
    keywords: ["programs", "projects", "economic empowerment", "livelihoods", "MSMEs", "cooperatives", "market access"],
  });
  return {
    ...base,
    other: {
      ...(pillarName ? { "article:section": pillarName } : {}),
      ...(locationStr ? { "geo.placename": locationStr } : {}),
    },
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);

  if (!program) {
    notFound();
  }

  return (
    <>
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "Project",
      name: program.titleEn,
      description: program.summaryEn,
      ...(program.coverImageUrl ? { image: `https://theleeexperience.com${program.coverImageUrl}` } : {}),
      ...(program.locationEn ? { location: { "@type": "Place", name: program.locationEn } } : {}),
      ...(program.donorEn ? { funder: { "@type": "Organization", name: program.donorEn } } : {}),
      url: `https://theleeexperience.com/en/programs/${program.slug}`,
    }} />
    <ProgramPage
      program={{
        titleEn: program.titleEn,
        titleAr: program.titleAr,
        bodyEn: program.bodyEn,
        bodyAr: program.bodyAr,
        objectivesEn: program.objectivesEn,
        objectivesAr: program.objectivesAr,
        summaryEn: program.summaryEn,
        summaryAr: program.summaryAr,
        coverImageUrl: program.coverImageUrl || "",
        status: program.status,
        year: program.year || new Date().getFullYear(),
        endYear: program.endYear,
        donorEn: program.donorEn || "",
        donorAr: program.donorAr || "",
        locationEn: program.locationEn || "",
        locationAr: program.locationAr || "",
        beneficiaries: program.beneficiaries,
        pillar: program.pillar,
        images: program.images.map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          caption: img.caption ?? null,
        })),
        stats: program.stats.map((s) => ({
          labelEn: s.labelEn,
          labelAr: s.labelAr,
          value: s.value,
          suffix: s.suffix ?? undefined,
          icon: s.icon ?? undefined,
        })),
        team: program.teamMembers.map((tm) => ({
          nameEn: tm.nameEn,
          nameAr: tm.nameAr,
          roleEn: tm.roleEn,
          roleAr: tm.roleAr,
          category: tm.category ?? "team",
          imageUrl: tm.imageUrl ?? undefined,
          linkedinUrl: tm.linkedinUrl ?? undefined,
        })),
        videos: program.videos.map((v) => ({
          titleEn: v.titleEn ?? undefined,
          titleAr: v.titleAr ?? undefined,
          youtubeUrl: v.youtubeUrl,
        })),
        partners: program.partners.map((p) => ({
          nameEn: p.nameEn,
          nameAr: p.nameAr,
          logoUrl: p.logoUrl ?? undefined,
          websiteUrl: p.websiteUrl ?? undefined,
        })),
      }}
    />
    </>
  );
}
