import { notFound } from "next/navigation";
import { demoEvents } from "@/components/sections/events/eventsData";
import { EventPage } from "@/components/sections/events/EventPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const event = demoEvents.find((e) => e.slug === slug);
  if (!event) return {};

  const isAr = locale === "ar";
  return {
    title: isAr ? event.titleAr : event.titleEn,
    description: isAr ? event.summaryAr : event.summaryEn,
  };
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

  return <EventPage event={event} />;
}
