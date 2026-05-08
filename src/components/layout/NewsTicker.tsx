"use client";

import { useLocale } from "next-intl";
import { Newspaper } from "lucide-react";

const newsItems = [
  {
    textEn: "New Program Launch: Economic Empowerment for Women in North Lebanon — Applications Open!",
    textAr: "إطلاق برنامج جديد: التمكين الاقتصادي للمرأة في شمال لبنان — التقديم مفتوح!",
  },
  {
    textEn: "LEE Experience expands operations to 10 countries across MENA region",
    textAr: "تجربة LEE توسع عملياتها إلى 10 دول عبر منطقة الشرق الأوسط وشمال أفريقيا",
  },
  {
    textEn: "38,790+ beneficiaries supported — Join us in making a difference!",
    textAr: "أكثر من 38,790 مستفيد — انضم إلينا لإحداث فرق!",
  },
  {
    textEn: "Nawara Program: Empowering GBV survivors through entrepreneurship and skills training",
    textAr: "برنامج نوّأة: تمكين الناجيات من العنف القائم على النوع الاجتماعي من خلال ريادة الأعمال",
  },
  {
    textEn: "Digital Entrepreneurship Program (DEP) — Free 8-week online course with Forward Inc",
    textAr: "برنامج ريادة الأعمال الرقمية (DEP) — دورة مجانية عبر الإنترنت لمدة 8 أسابيع مع Forward Inc",
  },
];

export function NewsTicker() {
  const locale = useLocale();

  const items = newsItems.map((item) =>
    locale === "ar" ? item.textAr : item.textEn
  );

  // Duplicate for seamless loop
  const allItems = [...items, ...items];

  return (
    <div role="marquee" aria-live="polite" aria-label="News ticker" className="bg-brand-black text-white overflow-hidden">
      <div className="flex items-center h-8">
        {/* Label */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 bg-brand-blue h-full text-[11px] font-bold uppercase tracking-wider z-10">
          <Newspaper className="w-3 h-3" />
          {locale === "ar" ? "أخبار" : "News"}
        </div>

        {/* Scrolling content */}
        <div className="relative flex-1 overflow-hidden">
          <div className="flex animate-news-scroll whitespace-nowrap">
            {allItems.map((text, i) => (
              <span
                key={i}
                className="inline-flex items-center text-[12px] px-6"
              >
                <span className="w-1.5 h-1.5 bg-brand-blue rounded-full mr-3 rtl:mr-0 rtl:ml-3 flex-shrink-0" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes newsScroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        [dir="rtl"] .animate-news-scroll {
          animation: newsScrollRtl 45s linear infinite;
        }
        .animate-news-scroll {
          animation: newsScroll 45s linear infinite;
        }
        .animate-news-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes newsScrollRtl {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(50%);
          }
        }
      `}</style>
    </div>
  );
}
