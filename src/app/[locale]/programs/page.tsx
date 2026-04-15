import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { ProgramsGrid } from "@/components/sections/programs/ProgramsGrid";
import { getPrograms } from "@/lib/data/programs";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "programs" });
  return {
    title: t("pageTitle"),
    description: t("pageSubtitle"),
    keywords: "LEEE programs, projects, economic empowerment, livelihoods, MSMEs, cooperatives, market access, implementation, women empowerment, youth development, green economy",
  };
}

export default async function ProgramsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "programs" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const programs = await getPrograms();

  const serialized = programs.map((p) => ({
    id: p.id,
    slug: p.slug,
    titleEn: p.titleEn,
    titleAr: p.titleAr,
    summaryEn: p.summaryEn,
    summaryAr: p.summaryAr,
    coverImageUrl: p.coverImageUrl,
    status: p.status,
    category: p.category,
    year: p.year,
    donorEn: p.donorEn,
    donorAr: p.donorAr,
    locationEn: p.locationEn,
    locationAr: p.locationAr,
    pillar: p.pillar,
  }));

  return (
    <>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        backgroundImage="/images/new/stage-group.jpg"
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: t("pageTitle") },
        ]}
      />

      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[5%] end-[4%] w-20 h-20 rounded-full bg-brand-blue/[0.05] animate-[float-slow_7s_ease-in-out_infinite]" />
          <div className="absolute top-[30%] start-[3%] w-12 h-12 rounded-full border-2 border-emerald-400/10 animate-[float-medium_6s_ease-in-out_infinite_0.5s]" />
          <div className="absolute bottom-[10%] end-[8%] text-amber-400/10 animate-[float-slow_5.5s_ease-in-out_infinite_1s]">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <div className="absolute bottom-[25%] start-[10%] w-4 h-4 rounded-full bg-pink-400/10 animate-[float-medium_4.5s_ease-in-out_infinite_0.8s]" />
          <div className="absolute top-[60%] end-[20%] rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1.3s]">
            <div className="w-5 h-5 bg-brand-blue/[0.06] rounded-sm" />
          </div>
        </div>

        <Container>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-surface-secondary animate-pulse rounded-2xl h-96" />
                ))}
              </div>
            }
          >
            <ProgramsGrid programs={serialized} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
