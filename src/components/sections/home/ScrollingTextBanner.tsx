"use client";

import { useLocale } from "next-intl";

const words = [
  { en: "Leadership", ar: "القيادة" },
  { en: "Entrepreneurship", ar: "ريادة الأعمال" },
  { en: "Empowerment", ar: "التمكين" },
  { en: "Innovation", ar: "الابتكار" },
  { en: "Community", ar: "المجتمع" },
  { en: "Impact", ar: "الأثر" },
  { en: "Development", ar: "التنمية" },
  { en: "Sustainability", ar: "الاستدامة" },
];

export function ScrollingTextBanner() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const items = words.map((w) => (isAr ? w.ar : w.en));
  const duplicated = [...items, ...items];

  return (
    <section className="py-6 md:py-8 bg-gradient-to-r from-brand-blue-deeper via-brand-blue-dark to-brand-blue-deeper overflow-hidden select-none">
      {/* Row 1 — scrolls left */}
      <div className="relative overflow-hidden mb-3 md:mb-4">
        <div className="flex animate-marquee-left whitespace-nowrap">
          {duplicated.map((text, i) => (
            <span
              key={`r1-${i}`}
              className="inline-flex items-center text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight mx-4 md:mx-6"
            >
              <span className="text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.25)] hover:text-brand-blue hover:[-webkit-text-stroke:0] transition-all duration-300 cursor-default">
                {text}
              </span>
              <span className="text-brand-blue mx-4 md:mx-6 text-2xl md:text-3xl">
                +
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right (reverse), filled style */}
      <div className="relative overflow-hidden">
        <div className="flex animate-marquee-right whitespace-nowrap">
          {duplicated.map((text, i) => (
            <span
              key={`r2-${i}`}
              className="inline-flex items-center text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight mx-4 md:mx-6"
            >
              <span className="text-white/10 hover:text-white transition-all duration-300 cursor-default">
                {text}
              </span>
              <span className="text-white/20 mx-4 md:mx-6 text-2xl md:text-3xl">
                /
              </span>
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marqueeLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marqueeRight {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: marqueeLeft 35s linear infinite;
        }
        .animate-marquee-right {
          animation: marqueeRight 40s linear infinite;
        }
        .animate-marquee-left:hover,
        .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
