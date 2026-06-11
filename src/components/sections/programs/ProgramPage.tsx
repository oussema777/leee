"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ProgramHero } from "./ProgramHero";
import { ProgramNavbar } from "./ProgramNavbar";
import { ProgramOverview } from "./ProgramOverview";
import { ProgramImpact } from "./ProgramImpact";
import { ProgramTeam } from "./ProgramTeam";
import { ProgramGalleryVideos } from "./ProgramGalleryVideos";
import { ProgramPartners } from "./ProgramPartners";
import { RegisterModal } from "./RegisterModal";

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
  endYear?: number | null;
  donorEn: string;
  donorAr: string;
  locationEn: string;
  locationAr: string;
  beneficiaries: number | null;
  pillar: { titleEn: string; titleAr: string } | null;
  images: { id: string; imageUrl: string; caption: string | null }[];
  stats: { labelEn: string; labelAr: string; value: number; suffix?: string; icon?: string }[];
  team: { nameEn: string; nameAr: string; roleEn: string; roleAr: string; category?: string; imageUrl?: string; linkedinUrl?: string }[];
  videos: { titleEn?: string | null; titleAr?: string | null; youtubeUrl: string }[];
  partners: { nameEn: string; nameAr: string; logoUrl?: string; websiteUrl?: string }[];
}

const navSections = [
  { id: "overview", labelEn: "Overview", labelAr: "نظرة عامة" },
  { id: "impact", labelEn: "Impact", labelAr: "الأثر" },
  { id: "team", labelEn: "Team", labelAr: "الفريق" },
  { id: "gallery", labelEn: "Gallery & Videos", labelAr: "المعرض والفيديو" },
  { id: "partners", labelEn: "Trusted By", labelAr: "موثوق من قبل" },
];

export function ProgramPage({ program }: { program: ProgramData }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [showRegister, setShowRegister] = useState(false);

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
        year={program.year}
        endYear={program.endYear}
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

      {/* Funded By */}
      {program.donorEn && (
        <div id="funded-by" className="py-12 bg-surface-secondary">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 text-center">
            <p className="text-text-muted text-sm font-semibold uppercase tracking-wider mb-3">
              {isAr ? "بتمويل من" : "Funded By"}
            </p>
            <p className="text-text-primary font-serif text-xl md:text-2xl">
              {isAr ? program.donorAr || program.donorEn : program.donorEn}
            </p>
          </div>
        </div>
      )}

      {/* Register CTA */}
      {program.status !== "COMPLETED" && (
        <div className="py-14 bg-brand-blue text-center">
          <div className="max-w-2xl mx-auto px-5">
            <h3 className="font-serif text-2xl md:text-3xl text-white mb-4">
              {isAr ? "هل أنت مهتم بهذا البرنامج؟" : "Interested in this program?"}
            </h3>
            <p className="text-white/80 mb-6">
              {isAr
                ? "سجّل اهتمامك وسنتواصل معك بمزيد من التفاصيل."
                : "Register your interest and we'll get in touch with more details."}
            </p>
            <button
              onClick={() => setShowRegister(true)}
              className="px-8 py-3 bg-white text-brand-blue font-bold rounded-full hover:bg-brand-gold hover:text-white transition-all duration-300 shadow-lg"
            >
              {isAr ? "سجّل الآن" : "Apply Now"}
            </button>
          </div>
        </div>
      )}

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        programTitle={isAr ? program.titleAr : program.titleEn}
      />
    </div>
  );
}
