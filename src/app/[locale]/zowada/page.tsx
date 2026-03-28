import { getTranslations } from "next-intl/server";
import { ZowadaHero } from "@/components/sections/zowada/ZowadaHero";
import { ZowadaFeatures } from "@/components/sections/zowada/ZowadaFeatures";
import { ZowadaConditions } from "@/components/sections/zowada/ZowadaConditions";
import { ZowadaStories } from "@/components/sections/zowada/ZowadaStories";
import { ZowadaPartners } from "@/components/sections/zowada/ZowadaPartners";
import { ZowadaVision } from "@/components/sections/zowada/ZowadaVision";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: "Zowada Digital Accelerator",
    description: "Your green business. In your pocket. Marketplace, classroom, mentor network, and funding portal for entrepreneurs.",
  };
}

export default async function ZowadaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  return (
    <>
      <ZowadaHero />

      <section className="py-12 md:py-16">
        <ZowadaFeatures />
      </section>

      <section className="py-12 md:py-16 bg-surface-secondary">
        <ZowadaConditions />
      </section>

      <section className="py-12 md:py-16">
        <ZowadaStories />
      </section>

      <section className="py-12 md:py-16 bg-surface-secondary">
        <ZowadaPartners />
      </section>

      <ZowadaVision />
    </>
  );
}
