import { HeroSlider } from "@/components/sections/home/HeroSlider";
import { VisionRibbon } from "@/components/sections/home/VisionRibbon";
import { StatsCounter } from "@/components/sections/home/StatsCounter";
import { WhoWeAreGrid } from "@/components/sections/home/WhoWeAreGrid";
import { ProgramsSection } from "@/components/sections/home/ProgramsSection";
import { CEOSection } from "@/components/sections/home/CEOSection";
import { PartnersCarousel } from "@/components/sections/home/PartnersCarousel";
import { JoinCommunity } from "@/components/sections/home/JoinCommunity";
import { LatestBeats } from "@/components/sections/home/LatestBeats";
import { NewsletterSection } from "@/components/sections/home/NewsletterSection";
import { CTABanner } from "@/components/sections/home/CTABanner";
import { getFeaturedPrograms } from "@/lib/data/programs";

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
      <VisionRibbon />
      <StatsCounter />
      <WhoWeAreGrid />
      <ProgramsSection programs={sliderPrograms} />
      <CEOSection />
      <PartnersCarousel />
      <JoinCommunity />
      <LatestBeats />
      <NewsletterSection />
      <CTABanner />
    </>
  );
}
