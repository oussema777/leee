import dynamic from "next/dynamic";
import { HeroSlider } from "@/components/sections/home/HeroSlider";
import { StatsCounter } from "@/components/sections/home/StatsCounter";
import { getFeaturedPrograms } from "@/lib/data/programs";

const WhoWeAreGrid = dynamic(
  () => import("@/components/sections/home/WhoWeAreGrid").then((m) => m.WhoWeAreGrid)
);
const ProgramsSection = dynamic(
  () => import("@/components/sections/home/ProgramsSection").then((m) => m.ProgramsSection)
);
const PartnersCarousel = dynamic(
  () => import("@/components/sections/home/PartnersCarousel").then((m) => m.PartnersCarousel)
);
const CEOSection = dynamic(
  () => import("@/components/sections/home/CEOSection").then((m) => m.CEOSection)
);
const LatestBeats = dynamic(
  () => import("@/components/sections/home/LatestBeats").then((m) => m.LatestBeats)
);
const NewsletterSection = dynamic(
  () => import("@/components/sections/home/NewsletterSection").then((m) => m.NewsletterSection)
);
const CTABanner = dynamic(
  () => import("@/components/sections/home/CTABanner").then((m) => m.CTABanner)
);

export default async function HomePage() {
  const featuredPrograms = await getFeaturedPrograms();

  const sliderPrograms = featuredPrograms.map((p) => ({
    id: p.id,
    slug: p.slug,
    titleEn: p.titleEn,
    titleAr: p.titleAr,
    summaryEn: p.summaryEn,
    summaryAr: p.summaryAr,
    coverImageUrl: p.coverImageUrl,
    status: p.status,
    year: p.year,
    donorEn: p.donorEn,
    donorAr: p.donorAr,
    locationEn: p.locationEn,
    locationAr: p.locationAr,
    pillar: p.pillar,
  }));

  return (
    <>
      <HeroSlider />
      <StatsCounter />
      <WhoWeAreGrid />
      <ProgramsSection programs={sliderPrograms} />
      <PartnersCarousel />
      <CEOSection />
      <LatestBeats />
      <NewsletterSection />
      <CTABanner />
    </>
  );
}
