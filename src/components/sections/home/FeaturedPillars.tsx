"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Link } from "@/i18n/navigation";
import {
  Lightbulb,
  GraduationCap,
  Users,
  BarChart3,
  Megaphone,
  BookOpen,
  Monitor,
} from "lucide-react";

const demoPillars = [
  { slug: "incubators", titleEn: "Incubators", titleAr: "الحاضنات", icon: "lightbulb", descEn: "Supporting startups and social enterprises through comprehensive incubation programs.", descAr: "دعم الشركات الناشئة والمؤسسات الاجتماعية من خلال برامج حاضنات شاملة." },
  { slug: "technical-assistance", titleEn: "Technical Assistance & Capacity Building", titleAr: "المساعدة الفنية وبناء القدرات", icon: "graduation", descEn: "Building organizational capacity through tailored training and technical support.", descAr: "بناء القدرات المؤسسية من خلال التدريب المخصص والدعم الفني." },
  { slug: "coaching", titleEn: "Coaching & Mentoring", titleAr: "التوجيه والإرشاد", icon: "users", descEn: "Expert guidance and mentorship to develop skills and leadership.", descAr: "توجيه وإرشاد الخبراء لتطوير المهارات والقيادة." },
  { slug: "research", titleEn: "Research & Data Analysis", titleAr: "البحث وتحليل البيانات", icon: "chart", descEn: "Evidence-based research to drive informed decisions and policy making.", descAr: "بحث قائم على الأدلة لدفع القرارات المستنيرة وصنع السياسات." },
  { slug: "marketing", titleEn: "Marketing & Communication", titleAr: "التسويق والتواصل", icon: "megaphone", descEn: "Strategic marketing and communication solutions for impactful outreach.", descAr: "حلول تسويق وتواصل استراتيجية للوصول المؤثر." },
  { slug: "academy", titleEn: "LEE Academy", titleAr: "أكاديمية LEE", icon: "book", descEn: "Comprehensive learning programs for professional and personal development.", descAr: "برامج تعلم شاملة للتطوير المهني والشخصي." },
];

const iconMap: Record<string, React.ReactNode> = {
  lightbulb: <Lightbulb className="w-7 h-7" />,
  graduation: <GraduationCap className="w-7 h-7" />,
  users: <Users className="w-7 h-7" />,
  chart: <BarChart3 className="w-7 h-7" />,
  megaphone: <Megaphone className="w-7 h-7" />,
  book: <BookOpen className="w-7 h-7" />,
  monitor: <Monitor className="w-7 h-7" />,
};

export function FeaturedPillars() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <section className="py-20 bg-surface-secondary">
      <Container>
        <SectionHeader
          title={t("pillarsTitle")}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoPillars.map((pillar, i) => (
            <AnimatedSection key={pillar.slug} delay={i * 0.1}>
              <Link href={`/programs?pillar=${pillar.slug}`}>
                <Card className="h-full group">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-4 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                      {iconMap[pillar.icon] || <Lightbulb className="w-7 h-7" />}
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-brand-blue transition-colors">
                      {locale === "ar" ? pillar.titleAr : pillar.titleEn}
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {locale === "ar" ? pillar.descAr : pillar.descEn}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </Container>
    </section>
  );
}
