"use client";

import { ProgramHero } from "./ProgramHero";
import { ProgramNavbar } from "./ProgramNavbar";
import { ProgramOverview } from "./ProgramOverview";
import { ProgramImpact } from "./ProgramImpact";
import { ProgramTeam } from "./ProgramTeam";
import { ProgramGalleryVideos } from "./ProgramGalleryVideos";
import { ProgramPartners } from "./ProgramPartners";
import { RelatedPrograms } from "./RelatedPrograms";

interface ProgramData {
  titleEn: string;
  titleAr: string;
  summaryEn?: string | null;
  summaryAr?: string | null;
  bodyEn: string;
  bodyAr: string;
  objectivesEn?: string | null;
  objectivesAr?: string | null;
  coverImageUrl: string;
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  year: number;
  donorEn: string;
  donorAr: string;
  locationEn: string;
  locationAr: string;
  budget: string | null;
  beneficiaries: number | null;
  pillar: { titleEn: string; titleAr: string } | null;
  images: { id: string; imageUrl: string; caption: string | null }[];
  stats: { labelEn: string; labelAr: string; value: number; suffix?: string; icon?: string }[];
  team: { nameEn: string; nameAr: string; roleEn: string; roleAr: string; imageUrl?: string; linkedinUrl?: string }[];
  videos: { titleEn?: string | null; titleAr?: string | null; youtubeUrl: string }[];
  partners: { nameEn: string; nameAr: string; logoUrl?: string; websiteUrl?: string }[];
  relatedPrograms: {
    id: string; slug: string; titleEn: string; titleAr: string;
    summaryEn: string; summaryAr: string; coverImageUrl: string | null;
    status: "ACTIVE" | "COMPLETED" | "UPCOMING"; year: number | null;
    donorEn: string | null; donorAr: string | null;
    locationEn: string | null; locationAr: string | null;
    pillar: { titleEn: string; titleAr: string } | null;
  }[];
}

const navSections = [
  { id: "overview", labelEn: "Overview", labelAr: "نظرة عامة" },
  { id: "impact", labelEn: "Impact", labelAr: "الأثر" },
  { id: "team", labelEn: "Team", labelAr: "الفريق" },
  { id: "gallery", labelEn: "Gallery & Videos", labelAr: "المعرض والفيديو" },
  { id: "partners", labelEn: "Partners", labelAr: "الشركاء" },
];

export function ProgramPage({ program }: { program: ProgramData }) {
  // Filter nav sections based on available data
  const activeSections = navSections.filter((section) => {
    if (section.id === "impact" && program.stats.length === 0) return false;
    if (section.id === "team" && program.team.length === 0) return false;
    if (section.id === "gallery" && program.images.length === 0 && program.videos.length === 0) return false;
    if (section.id === "partners" && program.partners.length === 0) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <ProgramHero
        titleEn={program.titleEn}
        titleAr={program.titleAr}
        summaryEn={program.summaryEn || undefined}
        summaryAr={program.summaryAr || undefined}
        coverImageUrl={program.coverImageUrl}
        status={program.status}
        pillar={program.pillar}
      />

      {/* Sticky Program Navbar */}
      <ProgramNavbar
        programTitleEn={program.titleEn}
        programTitleAr={program.titleAr}
        sections={activeSections}
      />

      {/* Overview Section */}
      <ProgramOverview
        bodyEn={program.bodyEn}
        bodyAr={program.bodyAr}
        objectivesEn={program.objectivesEn}
        objectivesAr={program.objectivesAr}
        status={program.status}
        pillar={program.pillar}
        donorEn={program.donorEn}
        donorAr={program.donorAr}
        locationEn={program.locationEn}
        locationAr={program.locationAr}
        budget={program.budget}
        year={program.year}
        beneficiaries={program.beneficiaries}
        galleryImages={program.images}
      />

      {/* Impact Stats */}
      <ProgramImpact stats={program.stats} />

      {/* Team */}
      <ProgramTeam members={program.team} />

      {/* Gallery & Videos */}
      <ProgramGalleryVideos
        images={program.images}
        videos={program.videos}
      />

      {/* Partners */}
      <ProgramPartners partners={program.partners} />

      {/* Related Programs */}
      {program.relatedPrograms.length > 0 && (
        <RelatedPrograms programs={program.relatedPrograms} />
      )}

    </div>
  );
}
