"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import type { EventCardData } from "./EventCard";

const categoryLabels: Record<string, { en: string; ar: string }> = {
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  webinar: { en: "Webinar", ar: "ندوة عبر الإنترنت" },
  conference: { en: "Conference", ar: "مؤتمر" },
  community: { en: "Community", ar: "مجتمعية" },
  training: { en: "Training", ar: "تدريب" },
};

export function FeaturedEventBanner({ event }: { event: EventCardData }) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  const dateStr = start.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const endStr = end
    ? ` — ${end.toLocaleDateString(isAr ? "ar-LB" : "en-US", { day: "numeric", month: "long" })}`
    : "";

  return (
    <div className="mb-10 overflow-hidden relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[320px]">
        {/* Image */}
        <div className="relative h-64 lg:h-auto">
          <img
            src={event.imageUrl}
            alt={isAr ? event.titleAr : event.titleEn}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-deeper/60 to-transparent lg:bg-none" />
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-brand-blue-deeper via-brand-blue-dark to-brand-blue p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              {isAr ? "فعالية مميزة" : "Featured Event"}
            </span>
            <Badge variant="yellow">
              {isAr ? categoryLabels[event.category]?.ar : categoryLabels[event.category]?.en}
            </Badge>
          </div>

          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">
            {isAr ? event.titleAr : event.titleEn}
          </h3>

          <p className="text-white/80 text-sm leading-relaxed mb-6 line-clamp-3">
            {isAr ? event.summaryAr : event.summaryEn}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm mb-6">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              <span>{dateStr}{endStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{isAr ? event.locationAr : event.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {event.registrationUrl && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" className="border-white text-white hover:bg-white hover:text-brand-blue-deeper">
                  {isAr ? "سجّل الآن" : "Register Now"}
                </Button>
              </a>
            )}
            <Link
              href={`/media/events/${event.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:gap-2.5 transition-all"
            >
              {isAr ? "التفاصيل" : "Learn More"}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
