import { QuickAccessCards } from "@/components/sections/home/QuickAccessCards";
import { HeroSlider } from "@/components/sections/home/HeroSlider";
import { AttendEvents } from "@/components/sections/home/AttendEvents";
import { ParallaxImpact } from "@/components/sections/home/ParallaxImpact";
import { AboutSection } from "@/components/sections/home/AboutSection";
import { ProgramsSection } from "@/components/sections/home/ProgramsSection";
import { JoinCommunity } from "@/components/sections/home/JoinCommunity";
import { CTABanner } from "@/components/sections/home/CTABanner";
import { LatestBeats } from "@/components/sections/home/LatestBeats";
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
      <QuickAccessCards />
      <AttendEvents />
      <AboutSection />
      <ParallaxImpact />
      <ProgramsSection programs={sliderPrograms} />
      <JoinCommunity />
      <LatestBeats />
      <CTABanner />
    </>
  );
}
