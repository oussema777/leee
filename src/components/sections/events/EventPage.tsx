"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { EventHero } from "./EventHero";
import { EventDetails } from "./EventDetails";
import { EventGallery } from "./EventGallery";
import { RelatedEvents } from "./RelatedEvents";
import type { DemoEvent } from "./eventsData";

export function EventPage({ event }: { event: DemoEvent }) {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <>
      <EventHero
        titleEn={event.titleEn}
        titleAr={event.titleAr}
        imageUrl={event.imageUrl}
        startDate={event.startDate}
        endDate={event.endDate}
        location={event.location}
        locationAr={event.locationAr}
        category={event.category}
        registrationUrl={event.registrationUrl}
      />

      <section className="py-10 md:py-14">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Description */}
              <div className="prose prose-lg max-w-none text-text-secondary leading-relaxed">
                {(isAr ? event.descriptionAr : event.descriptionEn)
                  .split("\n")
                  .map((paragraph, i) =>
                    paragraph.trim() ? (
                      <p key={i}>{paragraph}</p>
                    ) : null
                  )}
              </div>

              {/* Gallery */}
              {event.galleryImages && event.galleryImages.length > 0 && (
                <EventGallery
                  images={event.galleryImages}
                  titleEn={event.titleEn}
                  titleAr={event.titleAr}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <EventDetails
                startDate={event.startDate}
                endDate={event.endDate}
                location={event.location}
                locationAr={event.locationAr}
                category={event.category}
                registrationUrl={event.registrationUrl}
                slug={event.slug}
              />
            </div>
          </div>

          {/* Related Events */}
          <RelatedEvents
            currentSlug={event.slug}
            category={event.category}
          />
        </Container>
      </section>
    </>
  );
}
