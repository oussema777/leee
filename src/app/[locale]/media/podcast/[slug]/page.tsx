import { notFound } from "next/navigation";
import { demoEpisodes } from "@/components/sections/podcast/podcastData";
import { PodcastEpisodePage } from "@/components/sections/podcast/PodcastEpisodePage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const episode = demoEpisodes.find((e) => e.slug === slug);
  if (!episode) return {};

  const isAr = locale === "ar";
  return {
    title: isAr ? episode.titleAr : episode.titleEn,
    description: isAr ? episode.descriptionAr : episode.descriptionEn,
  };
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

  return <PodcastEpisodePage episode={episode} />;
}
