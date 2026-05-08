import { notFound } from "next/navigation";
import { demoEvents } from "@/components/sections/events/eventsData";
import { EventPage } from "@/components/sections/events/EventPage";
import { buildPageMetadata } from "@/lib/metadata";
import { JsonLd } from "@/components/shared/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const event = demoEvents.find((e) => e.slug === slug);
  if (!event) return {};

  const isAr = locale === "ar";
  return buildPageMetadata({
    title: isAr ? event.titleAr : event.titleEn,
    description: isAr ? event.summaryAr : event.summaryEn,
    path: `media/events/${slug}`,
    locale,
    ogImage: event.imageUrl,
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const event = demoEvents.find((e) => e.slug === slug);

  if (!event) {
    notFound();
  }

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.titleEn,
        description: event.summaryEn,
        startDate: event.startDate,
        ...(event.endDate ? { endDate: event.endDate } : {}),
        location: { "@type": "Place", name: event.location },
        image: event.imageUrl ? `https://theleeexperience.com${event.imageUrl}` : undefined,
        url: `https://theleeexperience.com/en/media/events/${event.slug}`,
        organizer: { "@type": "Organization", name: "The LEE Experience" },
      }} />
      <EventPage event={event} />
    </>
  );
}
