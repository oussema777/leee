import type { Metadata } from "next";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BookOpen, Gift, HandHeart, HeartHandshake, PackageCheck, Recycle, ShieldCheck, Sparkles, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { PhoenixBookCarousel, type PhoenixFeaturedBook } from "@/components/sections/phoenix/PhoenixBookCarousel";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["500", "600", "700", "800"], display: "swap" });
type PhoenixPageProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PhoenixPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "phoenix" });
  return {
    title: "Phoenix",
    description: t("metaDescription"),
    alternates: {
      canonical: "https://theleeexperience.com/" + locale + "/phoenix",
      languages: { en: "https://theleeexperience.com/en/phoenix", ar: "https://theleeexperience.com/ar/phoenix" },
    },
  };
}

export default async function PhoenixLandingPage({ params }: PhoenixPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "phoenix" });
  const isArabic = locale === "ar";

  let featuredBooks: PhoenixFeaturedBook[] = [];
  try {
    featuredBooks = await db.bookInventoryItem.findMany({
      where: { isPublished: true, status: "AVAILABLE", stockQuantity: { gt: 0 } },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 8,
      select: {
        id: true,
        slug: true,
        title: true,
        titleAr: true,
        author: true,
        authorAr: true,
        priceCents: true,
        currency: true,
        coverImageUrl: true,
        condition: true,
      },
    });
  } catch (error) {
    console.error("Phoenix featured books could not load", error);
  }

  const actions = [
    { title: t("heroPrimaryLabel"), text: t("heroPrimaryText"), href: "/books" as const, icon: BookOpen, tone: "bg-[#0D2B66] text-white", linkTone: "bg-[#F2A65A] text-[#0D2B66] hover:bg-[#ffc27d]" },
    { title: t("heroSecondaryLabel"), text: t("heroSecondaryText"), href: "/book-restore" as const, icon: HandHeart, tone: "bg-[#5D95CD] text-white", linkTone: "bg-white text-[#0D2B66] hover:bg-[#FAF9F6]" },
    { title: t("heroTertiaryLabel"), text: t("heroTertiaryText"), href: "/get-involved" as const, icon: Users, tone: "bg-white text-[#0D2B66] ring-1 ring-[#0D2B66]/10", linkTone: "bg-[#0D2B66] text-white hover:bg-[#173f86]" },
  ];
  const features = [
    { title: t("featureOneTitle"), text: t("featureOneText"), icon: BookOpen, image: "/images/phoenix/phoenix-discover.webp", alt: isArabic ? "قارئة تختار كتاباً مستعملاً" : "A reader discovering a pre-loved book" },
    { title: t("featureTwoTitle"), text: t("featureTwoText"), icon: Recycle, image: "/images/phoenix/phoenix-donate.webp", alt: isArabic ? "متطوعون يفرزون الكتب المتبرع بها" : "Volunteers carefully sorting donated books" },
    { title: t("featureThreeTitle"), text: t("featureThreeText"), icon: ShieldCheck, image: "/images/phoenix/phoenix-verify.webp", alt: isArabic ? "فريق يوثّق الكتب ويدققها" : "A team logging and verifying sorted books" },
  ];
  const buyerSteps = [[t("buyerFlowStep1"), t("buyerFlowStep1Text")], [t("buyerFlowStep2"), t("buyerFlowStep2Text")], [t("buyerFlowStep3"), t("buyerFlowStep3Text")]];
  const donorSteps = [[t("donorFlowStep1"), t("donorFlowStep1Text")], [t("donorFlowStep2"), t("donorFlowStep2Text")], [t("donorFlowStep3"), t("donorFlowStep3Text")], [t("donorFlowStep4"), t("donorFlowStep4Text")]];
  const values = [[t("value1Title"), t("value1Text"), Sparkles], [t("value2Title"), t("value2Text"), HeartHandshake], [t("value3Title"), t("value3Text"), ShieldCheck]] as const;

  return (
    <div className={"overflow-hidden bg-[#FAF9F6] text-[#0D2B66] " + (isArabic ? "font-arabic" : montserrat.className)}>
      <section className="relative isolate bg-[#0D2B66] text-white">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div className="absolute -end-20 -top-40 h-[34rem] w-[34rem] rounded-full border-[5rem] border-[#5D95CD]/25" />
          <div className="absolute -bottom-52 start-[24%] h-[28rem] w-[58rem] rotate-[-8deg] rounded-[50%] border-[3rem] border-[#5D95CD]/20" />
          <div className="absolute end-[43%] top-0 h-28 w-2 bg-[#F2A65A]" />
        </div>
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-10 inline-flex rounded-2xl bg-white px-5 py-3 shadow-sm">
              <Image src="/images/phoenix/phoenix-logo.png" alt="Phoenix — an initiative by LEE" width={800} height={333} className="h-auto w-44 sm:w-52" priority />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#F2A65A]">{t("eyebrow")}</p>
            <h1 className="mt-5 max-w-xl text-balance text-4xl font-extrabold uppercase leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl">{t("heroTitle")}</h1>
            <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-white/85 sm:text-xl">{t("heroSubtitle")}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/books" label={t("booksCta")} />
              <Link href="/book-restore" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-white/70 px-6 py-3 font-bold transition hover:bg-white hover:text-[#0D2B66] focus-visible:ring-2 focus-visible:ring-[#F2A65A]">{t("donateCta")}<HandHeart className="h-5 w-5" /></Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-2xl lg:translate-x-12 rtl:lg:-translate-x-12">
            <div className="absolute -inset-3 rounded-[2rem] border border-white/20" />
            <div className="relative aspect-[3/2] overflow-hidden rounded-[1.6rem] bg-[#5D95CD] shadow-2xl shadow-black/25">
              <Image src="/images/phoenix/phoenix-hero-community.webp" alt={isArabic ? "متطوعون يفرزون الكتب في مكتبة مجتمعية" : "Volunteers sorting and circulating books in a community library"} fill sizes="(min-width: 1024px) 52vw, 92vw" className="object-cover" priority />
            </div>
            <div className="absolute -bottom-5 end-5 max-w-[calc(100%-2.5rem)] rounded-xl bg-[#F2A65A] px-5 py-4 text-sm font-extrabold uppercase leading-tight text-[#0D2B66] shadow-xl sm:end-8 sm:px-7 sm:text-base">{isArabic ? "انقل الكتب بمسؤولية." : "Pass books on responsibly."}</div>
          </div>
        </div>
      </section>

      <section aria-label={t("supportTitle")} className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12 lg:py-24">
        <SectionHeading eyebrow={t("supportTitle")} title={isArabic ? "اختر طريقتك للمشاركة" : "Choose how you want to take part"} />
        <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-[#0D2B66]/65">{t("supportText")}</p>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return <article key={action.href} className={"flex min-h-72 flex-col rounded-3xl p-7 shadow-sm sm:p-8 " + action.tone}>
              <Icon className="h-9 w-9" aria-hidden="true" /><h3 className="mt-8 text-2xl font-extrabold">{action.title}</h3><p className="mt-3 flex-1 text-base font-medium leading-7 opacity-80">{action.text}</p>
              <Link href={action.href} className={"mt-7 inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl px-5 py-3 text-sm font-bold transition " + action.linkTone}>{action.title}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
            </article>;
          })}
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <SectionHeading eyebrow={t("eyebrow")} title={t("missionTitle")} />
          <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-[#0D2B66]/70">{t("missionText")}</p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return <article key={feature.title} className="group overflow-hidden rounded-3xl bg-[#FAF9F6] shadow-sm ring-1 ring-[#0D2B66]/[0.07]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={feature.image} alt={feature.alt} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                  <span className="absolute start-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-[#0D2B66] text-sm font-extrabold text-white shadow-lg">0{index + 1}</span>
                </div>
                <div className="p-7">
                  <Icon className="h-8 w-8 text-[#F2A65A]" aria-hidden="true" />
                  <h3 className="mt-5 text-xl font-extrabold">{feature.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-[#0D2B66]/65">{feature.text}</p>
                </div>
              </article>;
            })}
          </div>
        </div>
      </section>

      <PhoenixBookCarousel books={featuredBooks} locale={locale} />

      <section className="relative bg-white py-20 lg:py-28">
        <div aria-hidden="true" className="absolute -end-44 top-16 h-96 w-96 rounded-full border-[3rem] border-[#5D95CD]/10" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 sm:px-10 lg:grid-cols-2 lg:px-12">
          <JourneyCard eyebrow={t("buyerFlowTitle")} description={t("buyerFlowText")} steps={buyerSteps} cta={t("booksCta")} href="/books" accent="blue" />
          <JourneyCard eyebrow={t("donorFlowTitle")} description={t("donorFlowText")} steps={donorSteps} cta={t("donateCta")} href="/book-restore" accent="amber" />
        </div>
      </section>

      <section className="bg-[#0D2B66] py-20 text-white lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:px-10 lg:grid-cols-[0.65fr_1.35fr] lg:px-12">
          <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#F2A65A]">{t("valuesTitle")}</p><h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">{t("heroTitle")}</h2></div>
          <div className="grid gap-4 sm:grid-cols-3">{values.map(([title, text, Icon]) => <article key={title} className="rounded-2xl border border-white/15 bg-white/[0.06] p-6"><Icon className="h-7 w-7 text-[#F2A65A]" aria-hidden="true" /><h3 className="mt-6 text-xl font-extrabold">{title}</h3><p className="mt-3 text-sm font-medium leading-7 text-white/70">{text}</p></article>)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#5D95CD] py-20 text-white lg:py-24">
        <div aria-hidden="true" className="absolute inset-0">
          <BookOpen className="absolute -start-8 top-8 h-40 w-40 rotate-[-12deg] text-white/10" />
          <Gift className="absolute end-[26%] top-8 h-20 w-20 rotate-12 text-[#F2A65A]/35" />
          <PackageCheck className="absolute -bottom-8 end-6 h-44 w-44 text-white/10" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-6 sm:px-10 lg:flex-row lg:items-center lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0D2B66]">{t("supportTitle")}</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">{isArabic ? "أعط كتاباً. اختر كتاباً. وأكمل الحكاية." : "Give a book. Find a book. Keep the story moving."}</h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-white/85">{t("contactText")}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto">
            <Link href="/books" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#F2A65A] px-7 py-3 font-bold text-[#0D2B66] transition hover:-translate-y-0.5 hover:bg-[#ffc27d]"><BookOpen className="h-5 w-5" />{t("booksCta")}<ArrowRight className="h-5 w-5 rtl:rotate-180" /></Link>
            <Link href="/book-restore" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-white px-7 py-3 font-bold text-[#0D2B66] transition hover:-translate-y-0.5 hover:bg-[#FAF9F6]"><HandHeart className="h-5 w-5" />{t("donateCta")}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5D95CD]">{eyebrow}</p><h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{title}</h2></div>;
}

function PrimaryLink({ href, label }: { href: "/books"; label: string }) {
  return <Link href={href} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#F2A65A] px-7 py-3 font-bold text-[#0D2B66] transition hover:-translate-y-0.5 hover:bg-[#ffc27d] focus-visible:ring-2 focus-visible:ring-white">{label}<ArrowRight className="h-5 w-5 rtl:rotate-180" /></Link>;
}

function JourneyCard({ eyebrow, description, steps, cta, href, accent }: { eyebrow: string; description: string; steps: string[][]; cta: string; href: "/books" | "/book-restore"; accent: "blue" | "amber" }) {
  const isAmber = accent === "amber";
  return <article className={"rounded-[2rem] p-7 sm:p-10 " + (isAmber ? "bg-[#F2A65A]/15" : "bg-[#5D95CD]/15")}>
    <p className={"text-sm font-bold uppercase tracking-[0.2em] " + (isAmber ? "text-[#a9560c]" : "text-[#3978b7]")}>{eyebrow}</p><p className="mt-3 max-w-xl text-lg font-semibold leading-8 text-[#0D2B66]/75">{description}</p>
    <ol className="mt-9 space-y-3">{steps.map(([title, text], index) => <li key={title} className="grid grid-cols-[2.75rem_1fr] gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5"><span className={"flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold " + (isAmber ? "bg-[#F2A65A] text-[#0D2B66]" : "bg-[#0D2B66] text-white")}>{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-sm font-medium leading-6 text-[#0D2B66]/65">{text}</p></div></li>)}</ol>
    <Link href={href} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0D2B66] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#173f86]">{cta}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
  </article>;
}
