"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { CalendarDays, MapPin, ChevronRight } from "lucide-react";

interface EventHeroProps {
  titleEn: string;
  titleAr: string;
  imageUrl: string;
  startDate: string;
  endDate?: string;
  location: string;
  locationAr: string;
  category: string;
  registrationUrl?: string;
}

const categoryLabels: Record<string, { en: string; ar: string }> = {
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  webinar: { en: "Webinar", ar: "ندوة عبر الإنترنت" },
  conference: { en: "Conference", ar: "مؤتمر" },
  community: { en: "Community", ar: "مجتمعية" },
  training: { en: "Training", ar: "تدريب" },
};

export function EventHero({
  titleEn,
  titleAr,
  imageUrl,
  startDate,
  endDate,
  location,
  locationAr,
  category,
  registrationUrl,
}: EventHeroProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const isUpcoming = start > new Date();

  const dateStr = start.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = start.toLocaleTimeString(isAr ? "ar-LB" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endDateStr = end
    ? ` — ${end.toLocaleDateString(isAr ? "ar-LB" : "en-US", { day: "numeric", month: "long", year: "numeric" })}`
    : "";

  return (
    <section className="relative min-h-[420px] md:min-h-[480px] flex items-end">
      {/* Background */}
      <Image
        src={imageUrl}
        alt={isAr ? titleAr : titleEn}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-deeper/95 via-brand-blue-deeper/60 to-black/30" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-32">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            {isAr ? "الرئيسية" : "Home"}
          </Link>
          <ChevronRight className="w-3 h-3 rtl:rotate-180" />
          <Link href="/media/events" className="hover:text-white transition-colors">
            {isAr ? "الفعاليات" : "Events"}
          </Link>
          <ChevronRight className="w-3 h-3 rtl:rotate-180" />
          <span className="text-white/90 truncate max-w-[200px]">
            {isAr ? titleAr : titleEn}
          </span>
        </nav>

        <div className="flex items-center gap-3 mb-4">
          <Badge variant="yellow">
            {isAr ? categoryLabels[category]?.ar : categoryLabels[category]?.en}
          </Badge>
          {isUpcoming && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1">
              {isAr ? "قادمة" : "Upcoming"}
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 max-w-4xl leading-tight">
          {isAr ? titleAr : titleEn}
        </h1>

        <div className="flex flex-wrap items-center gap-5 text-white/80 text-sm mb-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span>{dateStr}{endDateStr} — {timeStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{isAr ? locationAr : location}</span>
          </div>
        </div>

        {registrationUrl && isUpcoming && (
          <a href={registrationUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="text-base">
              {isAr ? "سجّل الآن" : "Register Now"}
            </Button>
          </a>
        )}
      </div>
    </section>
  );
}
