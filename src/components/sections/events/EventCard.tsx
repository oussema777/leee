"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Image from "next/image";
import { MapPin, Clock, ArrowRight } from "lucide-react";

export interface EventCardData {
  slug: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  imageUrl: string;
  startDate: string;
  endDate?: string;
  location: string;
  locationAr: string;
  category: string;
  registrationUrl?: string;
  isFeatured?: boolean;
}

const categoryColors: Record<string, "blue" | "green" | "red" | "yellow"> = {
  workshop: "blue",
  webinar: "green",
  conference: "red",
  community: "yellow",
  training: "blue",
};

const categoryLabels: Record<string, { en: string; ar: string }> = {
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  webinar: { en: "Webinar", ar: "ندوة عبر الإنترنت" },
  conference: { en: "Conference", ar: "مؤتمر" },
  community: { en: "Community", ar: "مجتمعية" },
  training: { en: "Training", ar: "تدريب" },
};

export function EventCard({
  slug,
  titleEn,
  titleAr,
  summaryEn,
  summaryAr,
  imageUrl,
  startDate,
  location,
  locationAr,
  category,
}: EventCardData) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const date = new Date(startDate);
  const day = date.getDate();
  const month = date.toLocaleDateString(isAr ? "ar-LB" : "en-US", { month: "short" });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString(isAr ? "ar-LB" : "en-US", { hour: "2-digit", minute: "2-digit" });

  const isPast = date < new Date();

  return (
    <Link href={`/media/events/${slug}`}>
      <Card className="h-full flex flex-col group">
        <div className="relative overflow-hidden h-52">
          <Image
            src={imageUrl}
            alt={isAr ? titleAr : titleEn}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isPast ? "grayscale-[30%]" : ""}`}
          />
          {/* Date chip */}
          <div className="absolute top-3 start-3 bg-brand-blue text-white text-center px-3 py-1.5 min-w-[56px]">
            <div className="text-lg font-bold leading-tight">{day}</div>
            <div className="text-[10px] uppercase tracking-wider font-medium">{month}</div>
          </div>
          {/* Category badge */}
          <div className="absolute top-3 end-3">
            <Badge variant={categoryColors[category] || "blue"}>
              {isAr ? categoryLabels[category]?.ar : categoryLabels[category]?.en}
            </Badge>
          </div>
          {isPast && (
            <div className="absolute inset-0 bg-black/10" />
          )}
        </div>

        <CardContent className="flex-1 flex flex-col p-5">
          <h3 className="text-base font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-brand-blue transition-colors">
            {isAr ? titleAr : titleEn}
          </h3>
          <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">
            {isAr ? summaryAr : summaryEn}
          </p>

          <div className="space-y-1.5 text-xs text-text-muted mb-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isAr ? locationAr : location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{`${day} ${month} ${year} — ${time}`}</span>
            </div>
          </div>

          <div className="flex items-center text-sm font-medium text-brand-blue group-hover:gap-2 gap-1 transition-all">
            <span>{isAr ? "عرض الفعالية" : "View Event"}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
