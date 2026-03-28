"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { EventCard } from "./EventCard";
import { FeaturedEventBanner } from "./FeaturedEventBanner";
import { EventFilters } from "./EventFilters";
import { CalendarX2 } from "lucide-react";
import { demoEvents } from "./eventsData";

export function EventsGrid() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "";
  const currentCategory = searchParams.get("category") || "";
  const now = new Date();

  const filteredEvents = demoEvents.filter((event) => {
    const eventDate = new Date(event.startDate);
    if (currentStatus === "UPCOMING" && eventDate <= now) return false;
    if (currentStatus === "PAST" && eventDate > now) return false;
    if (currentCategory && event.category !== currentCategory) return false;
    return true;
  });

  const categories = [...new Set(demoEvents.map((e) => e.category))];

  // Find featured upcoming event
  const featuredEvent = demoEvents.find((e) => e.isFeatured && new Date(e.startDate) > now);

  return (
    <>
      {/* Featured Event Banner */}
      {featuredEvent && !currentStatus && !currentCategory && (
        <FeaturedEventBanner event={featuredEvent} />
      )}

      <EventFilters categories={categories} />

      <p className="text-sm text-text-muted mb-6">
        {filteredEvents.length} {isAr ? "فعاليات" : "events"}
      </p>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <CalendarX2 className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary text-lg">
            {isAr
              ? "لم يتم العثور على فعاليات تطابق معايير البحث."
              : "No events found matching your filters."}
          </p>
        </div>
      )}
    </>
  );
}
