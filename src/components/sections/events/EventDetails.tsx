"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CalendarDays,
  Clock,
  MapPin,
  Tag,
  Share2,
  Link2,
  ExternalLink,
} from "lucide-react";

interface EventDetailsProps {
  startDate: string;
  endDate?: string;
  location: string;
  locationAr: string;
  category: string;
  registrationUrl?: string;
  slug: string;
}

const categoryLabels: Record<string, { en: string; ar: string }> = {
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  webinar: { en: "Webinar", ar: "ندوة عبر الإنترنت" },
  conference: { en: "Conference", ar: "مؤتمر" },
  community: { en: "Community", ar: "مجتمعية" },
  training: { en: "Training", ar: "تدريب" },
};

export function EventDetails({
  startDate,
  endDate,
  location,
  locationAr,
  category,
  registrationUrl,
  slug,
}: EventDetailsProps) {
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
    ? end.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const endTimeStr = end
    ? end.toLocaleTimeString(isAr ? "ar-LB" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(document.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm sticky top-6">
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-dark p-5">
        <h3 className="text-lg font-bold text-white">
          {isAr ? "تفاصيل الفعالية" : "Event Details"}
        </h3>
      </div>

      <div className="p-5 space-y-5">
        {/* Date */}
        <div className="flex gap-3">
          <div className="w-9 h-9 bg-brand-blue-light flex items-center justify-center shrink-0">
            <CalendarDays className="w-4.5 h-4.5 text-brand-blue" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">
              {isAr ? "التاريخ" : "Date"}
            </p>
            <p className="text-sm text-text-primary font-medium">{dateStr}</p>
            {endDateStr && (
              <p className="text-sm text-text-secondary">
                {isAr ? "إلى" : "to"} {endDateStr}
              </p>
            )}
          </div>
        </div>

        {/* Time */}
        <div className="flex gap-3">
          <div className="w-9 h-9 bg-brand-blue-light flex items-center justify-center shrink-0">
            <Clock className="w-4.5 h-4.5 text-brand-blue" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">
              {isAr ? "الوقت" : "Time"}
            </p>
            <p className="text-sm text-text-primary font-medium">{timeStr}</p>
            {endTimeStr && (
              <p className="text-sm text-text-secondary">
                {isAr ? "إلى" : "to"} {endTimeStr}
              </p>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex gap-3">
          <div className="w-9 h-9 bg-brand-blue-light flex items-center justify-center shrink-0">
            <MapPin className="w-4.5 h-4.5 text-brand-blue" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">
              {isAr ? "الموقع" : "Location"}
            </p>
            <p className="text-sm text-text-primary font-medium">
              {isAr ? locationAr : location}
            </p>
          </div>
        </div>

        {/* Category */}
        <div className="flex gap-3">
          <div className="w-9 h-9 bg-brand-blue-light flex items-center justify-center shrink-0">
            <Tag className="w-4.5 h-4.5 text-brand-blue" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">
              {isAr ? "الفئة" : "Category"}
            </p>
            <Badge variant="blue">
              {isAr ? categoryLabels[category]?.ar : categoryLabels[category]?.en}
            </Badge>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Registration Button */}
        {registrationUrl && isUpcoming ? (
          <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full text-base gap-2">
              <ExternalLink className="w-4 h-4" />
              {isAr ? "سجّل الآن" : "Register Now"}
            </Button>
          </a>
        ) : !isUpcoming ? (
          <div className="text-center py-2 px-4 bg-gray-50 text-sm text-text-muted">
            {isAr ? "انتهت هذه الفعالية" : "This event has ended"}
          </div>
        ) : null}

        {/* Share */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            {isAr ? "مشاركة" : "Share"}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-blue transition-colors bg-gray-50 hover:bg-brand-blue-light px-3 py-2"
            >
              <Link2 className="w-3.5 h-3.5" />
              {isAr ? "نسخ الرابط" : "Copy Link"}
            </button>
            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-blue transition-colors bg-gray-50 hover:bg-brand-blue-light px-3 py-2"
            >
              𝕏
            </button>
            <button
              onClick={handleShareLinkedIn}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-blue transition-colors bg-gray-50 hover:bg-brand-blue-light px-3 py-2"
            >
              in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
