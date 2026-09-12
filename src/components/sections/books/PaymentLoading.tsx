"use client";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, ShieldCheck, Wand2 } from "lucide-react";

export function PaymentLoading({ isArabic = false, href }: { isArabic?: boolean; href?: string }) {
  const steps = useMemo(() => {
    return isArabic
      ? [
          "جارٍ إنشاء طلب الدفع بشكل آمن",
          "نؤهبأحضير QR الخاص بـ Whish",
          "جارٍ تثبيت المبلغ وتفاصيل الكتب",
          "لحظات قليلة فقط، صفحة الدفع تجهز الآن",
        ]
      : [
          "Building your secure payment request",
          "Creating your Whish QR code",
          "Locking amount and book details",
          "Finalizing safe payment step",
        ];
  }, [isArabic]);

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % steps.length);
    }, 1250);

    return () => window.clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="mx-auto max-w-lg px-2 py-10 text-center sm:py-16" dir={isArabic ? "rtl" : "ltr"}>
      <div role="status" aria-live="polite">
        <div aria-hidden="true" className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-brand-blue/10 motion-safe:animate-pulse" />
          <LoaderCircle className="absolute inset-0 h-28 w-28 text-brand-blue/60 motion-safe:animate-spin" strokeWidth={1} />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-navy text-white shadow-lg">
            <Wand2 className="h-8 w-8" />
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-deeper">LEE Book Restore</p>
        <h2 className="mt-3 font-serif text-3xl text-accent-navy">
          {isArabic ? "جارٍ تجهيز صفحة الدفع" : "Preparing payment"}
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-text-secondary" aria-live="assertive">
          {steps[messageIndex]}
        </p>

        <div className="mx-auto mt-7 max-w-sm space-y-3" aria-hidden="true">
          <div className="h-3 w-3/5 rounded-full bg-brand-blue/20 motion-safe:animate-pulse" />
          <div className="h-3 w-11/12 rounded-full bg-brand-blue/20 motion-safe:animate-pulse" style={{ animationDelay: "140ms" }} />
          <div className="h-3 w-2/3 rounded-full bg-brand-blue/20 motion-safe:animate-pulse" style={{ animationDelay: "280ms" }} />
          <div className="mt-5 rounded-xl border border-accent-navy/10 bg-white p-4 text-left shadow-sm">
            <div className="mb-3 h-3 w-2/5 rounded-full bg-text-secondary/20 motion-safe:animate-pulse" />
            <div className="space-y-2 text-left">
              <div className="h-4 w-full rounded-lg bg-text-secondary/15 motion-safe:animate-pulse" style={{ animationDelay: "80ms" }} />
              <div className="h-4 w-3/5 rounded-lg bg-text-secondary/15 motion-safe:animate-pulse" style={{ animationDelay: "160ms" }} />
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 h-3 rounded-lg bg-text-secondary/15 motion-safe:animate-pulse" style={{ animationDelay: "220ms" }} />
                <div className="h-3 rounded-lg bg-text-secondary/15 motion-safe:animate-pulse" style={{ animationDelay: "280ms" }} />
              </div>
            </div>
          </div>
          <div className="mx-auto mt-2 flex max-w-xs gap-2">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                style={{ animationDelay: index * 180 + "ms" }}
                className="h-1.5 flex-1 rounded-full bg-brand-blue/25 motion-safe:animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-6 inline-flex items-center justify-center gap-2 text-xs leading-5 text-text-secondary">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        {isArabic
          ? "أنت ستكمّل التحويل داخل Whish"
          : "You will complete the transfer in Whish, so keep this screen open for a few seconds."}
      </p>
      {href && (
        <a
          href={href}
          className="mt-6 block rounded-xl border border-brand-blue/30 bg-white px-5 py-3 text-sm font-bold text-brand-blue-deeper hover:bg-accent-ice"
        >
          {isArabic ? "إذا تأخر التحويل، افتح صفحة الدفع" : "If this takes too long, continue to payment"}
        </a>
      )}
    </div>
  );
}
