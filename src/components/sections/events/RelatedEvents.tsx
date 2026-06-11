"use client";

import { useLocale } from "next-intl";
import { EventCard } from "./EventCard";
import type { EventListItem } from "@/lib/data/events";

interface RelatedEventsProps {
  events: EventListItem[];
}

export function RelatedEvents({ events }: RelatedEventsProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const related = events;

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
