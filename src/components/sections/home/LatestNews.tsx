"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardImage, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Link } from "@/i18n/navigation";
import { CalendarDays } from "lucide-react";

const demoNews = [
  {
    id: "1",
    type: "event",
    titleEn: "Community Building Workshop",
    titleAr: "ورشة بناء المجتمع",
    dateStr: "2026-03-20",
    imageUrl: "/images/nawra-women-training.jpg",
    summaryEn: "Join us for an interactive workshop on building resilient communities through collaboration.",
    summaryAr: "انضم إلينا في ورشة تفاعلية حول بناء مجتمعات مرنة من خلال التعاون.",
  },
  {
    id: "2",
    type: "blog",
    titleEn: "Impact Report 2025: A Year in Review",
    titleAr: "تقرير الأثر 2025: مراجعة سنوية",
    dateStr: "2026-03-10",
    imageUrl: "/images/certificate-presentation.jpg",
    summaryEn: "Discover the milestones we achieved in 2025 and our vision for the year ahead.",
    summaryAr: "اكتشف الإنجازات التي حققناها في 2025 ورؤيتنا للعام المقبل.",
  },
  {
    id: "3",
    type: "event",
    titleEn: "Youth Entrepreneurship Summit",
    titleAr: "قمة ريادة الأعمال للشباب",
    dateStr: "2026-04-05",
    imageUrl: "/images/training-presentation.jpg",
    summaryEn: "A summit bringing together young entrepreneurs from across the MENA region.",
    summaryAr: "قمة تجمع رواد الأعمال الشباب من جميع أنحاء منطقة الشرق الأوسط وشمال أفريقيا.",
  },
];

export function LatestNews() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="py-20 bg-surface-secondary">
      <Container>
        <SectionHeader title={t("home.newsTitle")} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoNews.map((item, i) => (
            <AnimatedSection key={item.id} delay={i * 0.1}>
              <Card className="h-full">
                <CardImage src={item.imageUrl} alt={item.titleEn} />
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={item.type === "event" ? "blue" : "green"}>
                      {item.type === "event" ? t("nav.events") : t("nav.blog")}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(item.dateStr).toLocaleDateString(locale === "ar" ? "ar-LB" : "en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    {locale === "ar" ? item.titleAr : item.titleEn}
                  </h3>
                  <p className="text-text-secondary text-sm line-clamp-2">
                    {locale === "ar" ? item.summaryAr : item.summaryEn}
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/media">
            <Button variant="secondary">{t("common.viewAll")} &rarr;</Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
