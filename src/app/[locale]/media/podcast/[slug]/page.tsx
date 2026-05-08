import { notFound } from "next/navigation";
import { demoEpisodes } from "@/components/sections/podcast/podcastData";
import { PodcastEpisodePage } from "@/components/sections/podcast/PodcastEpisodePage";
import { buildPageMetadata } from "@/lib/metadata";
import { JsonLd } from "@/components/shared/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const episode = demoEpisodes.find((e) => e.slug === slug);
  if (!episode) return {};

  const isAr = locale === "ar";
  return buildPageMetadata({
    title: isAr ? episode.titleAr : episode.titleEn,
    description: isAr ? episode.descriptionAr : episode.descriptionEn,
    path: `media/podcast/${slug}`,
    locale,
    ogImage: episode.coverImageUrl,
  });
}

export default async function PodcastDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const episode = demoEpisodes.find((e) => e.slug === slug);

  if (!episode) {
    notFound();
  }

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "PodcastEpisode",
        name: episode.titleEn,
        description: episode.descriptionEn,
        datePublished: episode.publishedAt,
        timeRequired: `PT${episode.durationMin}M`,
        image: episode.coverImageUrl ? `https://theleeexperience.com${episode.coverImageUrl}` : undefined,
        url: `https://theleeexperience.com/en/media/podcast/${episode.slug}`,
        partOfSeries: { "@type": "PodcastSeries", name: "The LEE Experience Podcast" },
      }} />
      <PodcastEpisodePage episode={episode} />
    </>
  );
}
