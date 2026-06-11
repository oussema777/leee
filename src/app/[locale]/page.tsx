import nextDynamic from "next/dynamic";
import { HeroSlider } from "@/components/sections/home/HeroSlider";
import { StatsCounter } from "@/components/sections/home/StatsCounter";
import { getFeaturedPrograms } from "@/lib/data/programs";
import { getExperienceNumbers } from "@/lib/data/stats";
import { getPartners } from "@/lib/data/partners";
import { getSliders } from "@/lib/data/sliders";
import { buildPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata({
    title: locale === "ar" ? "تجربة LEE — تمكين المجتمعات" : "The LEE Experience — Empowering Communities",
    description: locale === "ar"
      ? "تجربة LEE - تمكين المجتمعات من خلال التأثير الاجتماعي وبناء القدرات والتنمية المستدامة في لبنان ومنطقة الشرق الأوسط وشمال أفريقيا."
      : "The LEE Experience - Empowering communities through social impact, capacity building, and sustainable development in Lebanon and the MENA region.",
    path: "",
    locale,
    keywords: ["LEE Experience", "social enterprise", "MENA", "Lebanon", "empowerment", "sustainable development"],
  });
}

const WhoWeAreGrid = nextDynamic(
  () => import("@/components/sections/home/WhoWeAreGrid").then((m) => m.WhoWeAreGrid)
);
const ProgramsSection = nextDynamic(
  () => import("@/components/sections/home/ProgramsSection").then((m) => m.ProgramsSection)
);
const PartnersCarousel = nextDynamic(
  () => import("@/components/sections/home/PartnersCarousel").then((m) => m.PartnersCarousel)
);
const CEOSection = nextDynamic(
  () => import("@/components/sections/home/CEOSection").then((m) => m.CEOSection)
);
const LatestBeats = nextDynamic(
  () => import("@/components/sections/home/LatestBeats").then((m) => m.LatestBeats)
);
const NewsletterSection = nextDynamic(
  () => import("@/components/sections/home/NewsletterSection").then((m) => m.NewsletterSection)
);
const CTABanner = nextDynamic(
  () => import("@/components/sections/home/CTABanner").then((m) => m.CTABanner)
);

export default async function HomePage() {
  const [featuredPrograms, stats, partners, sliders] = await Promise.all([
    getFeaturedPrograms(),
    getExperienceNumbers(),
    getPartners(),
    getSliders(),
  ]);

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
      <HeroSlider slides={sliders} />
      <StatsCounter stats={stats} />
      <WhoWeAreGrid />
      <ProgramsSection programs={sliderPrograms} />
      <PartnersCarousel partners={partners} />
      <CEOSection />
      <LatestBeats />
      <NewsletterSection />
      <CTABanner />
    </>
  );
}
