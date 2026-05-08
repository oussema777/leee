import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { demoPosts } from "@/components/sections/blog/blogData";
import { demoEvents } from "@/components/sections/events/eventsData";
import { demoEpisodes } from "@/components/sections/podcast/podcastData";

const BASE_URL = "https://theleeexperience.com";
const locales = ["en", "ar"];

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

function localized(
  path: string,
  priority: number,
  changeFrequency: ChangeFrequency,
  lastModified: Date = new Date()
): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${path ? `/${path}` : ""}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // --- Static routes ---
  const staticRoutes: MetadataRoute.Sitemap = [
    // Home
    ...localized("", 1.0, "daily"),
    // Top-level pages
    ...localized("about", 0.9, "monthly"),
    ...localized("programs", 0.9, "weekly"),
    ...localized("impact", 0.9, "monthly"),
    // Media pages
    ...localized("media", 0.8, "monthly"),
    ...localized("media/blog", 0.8, "weekly"),
    ...localized("media/events", 0.8, "monthly"),
    ...localized("media/gallery", 0.8, "monthly"),
    ...localized("media/reports", 0.8, "monthly"),
    ...localized("media/testimonials", 0.8, "monthly"),
    ...localized("media/videos", 0.8, "monthly"),
    ...localized("media/podcast", 0.8, "monthly"),
    // Get-involved pages
    ...localized("get-involved", 0.7, "monthly"),
    ...localized("get-involved/entrepreneur", 0.7, "monthly"),
    ...localized("get-involved/partner", 0.7, "monthly"),
    ...localized("get-involved/expert", 0.7, "monthly"),
    ...localized("get-involved/advocate", 0.7, "monthly"),
    ...localized("get-involved/careers", 0.7, "monthly"),
    ...localized("get-involved/join-us", 0.7, "monthly"),
    // Zowada
    ...localized("zowada", 0.7, "monthly"),
  ];

  // --- Dynamic: Programs from DB ---
  let programRoutes: MetadataRoute.Sitemap = [];
  try {
    const programs = await db.program.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    programRoutes = programs.flatMap((p) =>
      locales.map((locale) => ({
        url: `${BASE_URL}/${locale}/programs/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    );
  } catch {
    // DB may be unavailable at build time; skip dynamic programs
  }

  // --- Dynamic: Blog posts ---
  const blogRoutes: MetadataRoute.Sitemap = demoPosts.flatMap((post) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/media/blog/${post.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  // --- Dynamic: Events ---
  const eventRoutes: MetadataRoute.Sitemap = demoEvents.flatMap((event) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/media/events/${event.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  // --- Dynamic: Podcast episodes ---
  const podcastRoutes: MetadataRoute.Sitemap = demoEpisodes.flatMap(
    (episode) =>
      locales.map((locale) => ({
        url: `${BASE_URL}/${locale}/media/podcast/${episode.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
  );

  return [
    ...staticRoutes,
    ...programRoutes,
    ...blogRoutes,
    ...eventRoutes,
    ...podcastRoutes,
  ];
}
