"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import type { ShowcaseMember } from "@/lib/data/members";
import { MemberCard } from "@/components/sections/experts/MemberCard";

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

export function AboutTeam({ team }: { team: ShowcaseMember[] }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  if (team.length === 0) return null;

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[3%] -end-10 w-[260px] h-[260px] bg-pink-400/[0.03] animate-[morph-blob_13s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[8%] -start-10 w-[200px] h-[200px] bg-brand-blue/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_2s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
        <div className="absolute top-[6%] start-[5%] w-14 h-14 rounded-full bg-emerald-400/[0.06] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute top-[10%] end-[8%] w-10 h-10 rounded-full border-2 border-brand-blue/10 animate-[float-medium_5.5s_ease-in-out_infinite_0.4s]" />
        <div className="absolute top-[50%] start-[2%] text-pink-400/12 animate-[float-slow_5s_ease-in-out_infinite_0.8s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <div className="absolute bottom-[12%] end-[12%] w-5 h-5 rounded-full bg-amber-400/12 animate-[float-medium_4.5s_ease-in-out_infinite_1.2s]" />
        <div className="absolute top-[30%] end-[22%] w-3 h-3 bg-violet-400/12 rotate-45 animate-[drift-horizontal_6s_ease-in-out_infinite_0.6s]" />
        <svg className="absolute bottom-[20%] start-[10%] w-28 h-28 text-brand-blue/[0.04] animate-[float-slow_12s_ease-in-out_infinite]" viewBox="0 0 112 112" fill="none">
          <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />
        </svg>
      </div>

      <Container>
        {/* Header — slide down */}
        <div
          className={cn(
            "text-center mb-14 transition-all duration-700 ease-out",
            sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          )}
        >
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "فريقنا" : "Meet The Team"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-3">
            {isAr ? "جذور محلية. رؤية عالمية." : "Local Roots. Global Vision."}
          </h2>
        </div>

        {/* Team grid — experts-style profile cards */}
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, i) => (
            <MemberCard key={member.id} member={member} index={i} visible={sectionAnim.visible} />
          ))}
        </div>
      </Container>
    </section>
  );
}
