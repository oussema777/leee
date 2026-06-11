"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import type { ShowcaseMember } from "@/lib/data/members";
import { MemberCard } from "./MemberCard";

function useInView(threshold = 0.12) {
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

function SectionHeader({ label, title, lead }: { label: string; title: string; lead?: string }) {
  const anim = useInView(0.3);
  return (
    <div
      ref={anim.ref}
      className={cn(
        "max-w-2xl mb-10 transition-all duration-700 ease-out motion-reduce:transition-none",
        anim.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 motion-reduce:opacity-100 motion-reduce:translate-y-0"
      )}
    >
      <span className="block text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-3">
        {label}
      </span>
      <span className="block w-12 h-[2px] bg-brand-blue mb-5 origin-start" />
      <h2 className="font-serif text-3xl md:text-4xl text-text-primary tracking-tight">{title}</h2>
      {lead && <p className="text-text-secondary leading-relaxed mt-4">{lead}</p>}
    </div>
  );
}

function MemberGrid({ members }: { members: ShowcaseMember[] }) {
  const anim = useInView(0.05);
  return (
    <div
      ref={anim.ref}
      className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    >
      {members.map((m, i) => (
        <MemberCard key={m.id} member={m} index={i} visible={anim.visible} />
      ))}
    </div>
  );
}

export function ExpertsShowcase({
  experts,
  mentors,
}: {
  experts: ShowcaseMember[];
  mentors: ShowcaseMember[];
}) {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <>
      {/* Framing band */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-3xl">
            <span className="block text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
              {isAr ? "شبكتنا" : "Our Network"}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-text-primary tracking-tight leading-[1.1]">
              {isAr
                ? "الأشخاص الذين يقفون خلف برامجنا"
                : "The people behind every program we run"}
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed mt-6">
              {isAr
                ? "من المدربين والمدربين التنفيذيين إلى المرشدين، يجلب خبراؤنا الخبرة القطاعية والتجربة الواقعية إلى رواد الأعمال والمجتمعات عبر الشرق الأوسط وأفريقيا."
                : "From trainers and coaches to mentors, our experts bring sector knowledge and real-world experience to entrepreneurs and communities across MENA and Africa."}
            </p>
          </div>
        </Container>
      </section>

      {/* Experts */}
      {experts.length > 0 && (
        <section className="pb-16 md:pb-24">
          <Container>
            <SectionHeader
              label={isAr ? "الخبراء" : "Experts"}
              title={isAr ? "خبراء متخصصون" : "Subject-matter experts"}
              lead={isAr
                ? "متخصصون يقودون التدريب والمساعدة الفنية وتطوير الأعمال عبر مجالاتهم."
                : "Specialists who lead training, technical assistance, and business development across their fields."}
            />
            <MemberGrid members={experts} />
          </Container>
        </section>
      )}

      {/* Mentors — alternate surface for rhythm */}
      {mentors.length > 0 && (
        <section className="py-16 md:py-24 bg-surface-secondary">
          <Container>
            <SectionHeader
              label={isAr ? "المرشدون" : "Mentors"}
              title={isAr ? "مرشدون ملهمون" : "Mentors who walk alongside founders"}
              lead={isAr
                ? "قادة يشاركون شبكاتهم وحكمتهم لمساعدة رواد الأعمال على اجتياز اللحظات المحورية."
                : "Leaders who share their networks and judgment to help founders through pivotal moments."}
            />
            <MemberGrid members={mentors} />
          </Container>
        </section>
      )}

      {/* CTA */}
      <section className="bg-accent-navy py-16 md:py-20">
        <Container>
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
              {isAr ? "شارك خبرتك" : "Share your expertise"}
            </h2>
            <p className="text-white/70 leading-relaxed mt-4 mb-8">
              {isAr
                ? "نبحث دائماً عن محترفين شغوفين بدعم ريادة الأعمال الخضراء وقيادة المرأة. انضم إلى مجموعة خبرائنا ومرشدينا."
                : "We are always looking for professionals who believe in green entrepreneurship and women's leadership. Join our pool of experts and mentors."}
            </p>
            <Link
              href="/get-involved/join-us?role=expert"
              className="inline-flex items-center gap-2 bg-brand-blue text-white font-semibold px-8 py-4 rounded-full hover:bg-brand-blue-dark transition-colors shadow-md"
            >
              {isAr ? "قدّم للانضمام" : "Apply to join our expert pool"}
              <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
