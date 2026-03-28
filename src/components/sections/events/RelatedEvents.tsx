"use client";

import { useLocale } from "next-intl";
import { EventCard } from "./EventCard";
import { demoEvents } from "./eventsData";
import type { EventCardData } from "./EventCard";

interface RelatedEventsProps {
  currentSlug: string;
  category: string;
}

export function RelatedEvents({ currentSlug, category }: RelatedEventsProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  // Find related: same category first, then any other, exclude current
  const sameCategory = demoEvents.filter(
    (e) => e.slug !== currentSlug && e.category === category
  );
  const others = demoEvents.filter(
    (e) => e.slug !== currentSlug && e.category !== category
  );
  const related = [...sameCategory, ...others].slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="py-10 border-t border-gray-100">
      <h2 className="text-xl font-bold text-text-primary mb-6">
        {isAr ? "فعاليات ذات صلة" : "Related Events"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((event) => (
          <EventCard key={event.id} {...event} />
        ))}
      </div>
    </section>
  );
}
