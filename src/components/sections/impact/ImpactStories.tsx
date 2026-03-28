"use client";

import { useRef, useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const previewStories = [
  {
    nameEn: "Rima's Journey with NAWRA",
    nameAr: "رحلة ريما مع نورة",
    quoteEn: "From a single mother sewing at home to employing 12 women in sustainable fashion.",
    quoteAr: "من أم عزباء تخيط في المنزل إلى توظيف 12 امرأة في الأزياء المستدامة.",
    slug: "rima-story-from-idea-to-fashion-brand",
    imageUrl: "/images/new/coaching-session.jpg",
    color: "bg-brand-blue",
    iconBg: "bg-brand-blue/10",
    borderColor: "border-brand-blue/15",
  },
  {
    nameEn: "Houla Green Fashion Factory",
    nameAr: "مصنع حولا للأزياء الخضراء",
    quoteEn: "50+ women building economic empowerment through sustainable fashion production.",
    quoteAr: "أكثر من 50 امرأة يبنين التمكين الاقتصادي من خلال إنتاج الأزياء المستدامة.",
    slug: "houla-factory-one-year-milestone",
    imageUrl: "/images/new/greenhouse-visit.jpg",
    color: "bg-emerald-500",
    iconBg: "bg-emerald-50",
    borderColor: "border-emerald-400/15",
  },
  {
    nameEn: "Community Kitchens: More Than Meals",
    nameAr: "المطابخ المجتمعية: أكثر من وجبات",
    quoteEn: "Building social cohesion between host communities and displaced families through food.",
    quoteAr: "بناء التماسك الاجتماعي بين المجتمعات المضيفة والعائلات النازحة من خلال الطعام.",
    slug: "community-kitchens-social-cohesion",
    imageUrl: "/images/new/community-table.jpg",
    color: "bg-amber-500",
    iconBg: "bg-amber-50",
    borderColor: "border-amber-400/15",
  },
];

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export function ImpactStories() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-14 -start-14 w-[300px] h-[300px] bg-brand-blue/[0.03] animate-[morph-blob_14s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute -bottom-10 end-[8%] w-[240px] h-[240px] bg-amber-400/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_3s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[6%] end-[5%] w-16 h-16 rounded-full border-2 border-emerald-400/[0.07] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[15%] start-[4%] w-5 h-5 rounded-full bg-pink-400/12 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[35%] end-[3%] w-4 h-4 bg-violet-400/10 rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[18%] start-[7%] w-3 h-3 rounded-full bg-cyan-400/12 animate-[float-medium_4s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-[25%] end-[18%] text-brand-blue/[0.06] animate-[float-slow_7s_ease-in-out_infinite_1.5s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <svg className="absolute bottom-[10%] start-[12%] w-20 h-20 text-emerald-400/[0.04] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
      </div>

      <Container>
        {/* Header */}
        <div className={cn("text-center mb-6 transition-all duration-700", sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "قصص حقيقية" : "Real Stories"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-3">
            {isAr ? "قصص الأثر" : "Impact Stories"}
          </h2>
          <p className="text-text-secondary text-[15px] max-w-2xl mx-auto leading-relaxed">
            {isAr ? "خلف كل رقم، إنسان" : "Behind every number, a person"}
          </p>
        </div>

        {/* Pull quote */}
        <div className={cn("text-center mb-14 transition-all duration-700", sectionAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-95")} style={{ transitionDelay: "100ms" }}>
          <p className="font-serif text-xl md:text-2xl text-text-secondary italic">
            {isAr
              ? "\"الأرقام لا تغير العالم. الناس يفعلون.\""
              : "\"Numbers don't change the world. People do.\""}
          </p>
        </div>

        {/* Story cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewStories.map((story, i) => {
            const fromLeft = i === 0;
            const fromRight = i === 2;
            return (
              <div
                key={story.slug}
                className={cn(
                  "group relative bg-surface-secondary rounded-2xl overflow-hidden border border-surface-tertiary transition-all duration-700 ease-out hover:shadow-xl hover:-translate-y-1.5",
                  story.borderColor,
                  sectionAnim.visible
                    ? "opacity-100 translate-x-0 translate-y-0"
                    : fromLeft
                      ? "opacity-0 -translate-x-10 translate-y-4"
                      : fromRight
                        ? "opacity-0 translate-x-10 translate-y-4"
                        : "opacity-0 scale-95 translate-y-4"
                )}
                style={{ transitionDelay: `${250 + i * 120}ms` }}
              >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={story.imageUrl}
                    alt={isAr ? story.nameAr : story.nameEn}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {/* Color accent bar */}
                  <div className={cn("absolute bottom-0 inset-x-0 h-1 transition-all duration-500 group-hover:h-1.5", story.color)} />
                </div>

                <div className="p-6">
                  {/* Abstract ring */}
                  <div className={cn("absolute -top-3 -end-3 w-12 h-12 rounded-full border-2 opacity-30 group-hover:scale-110 transition-transform duration-500", story.borderColor)} />

                  <h3 className="font-serif text-lg text-text-primary mb-2 tracking-tight">
                    {isAr ? story.nameAr : story.nameEn}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-5 italic">
                    {isAr ? story.quoteAr : story.quoteEn}
                  </p>
                  <Link
                    href={`/media/blog/${story.slug}`}
                    className="inline-flex items-center gap-2 text-brand-blue text-sm font-semibold group-hover:gap-3 transition-all duration-300"
                  >
                    {isAr ? "اقرأ القصة كاملة" : "Read full story"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
