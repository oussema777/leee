import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { BookVolunteerForm } from "@/components/sections/book-restore/BookVolunteerForm";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata({
    title: locale === "ar" ? "تطوّع مع مشروع إحياء الكتب — تجربة LEE" : "Volunteer for Book Restore — The LEE Experience",
    description: locale === "ar" ? "ساعد في جمع الكتب وتجهيز الطلبات والمقابلات وصناعة المحتوى." : "Help collect books, prepare orders, conduct street interviews, or create content for Book Restore.",
    path: "book-restore/volunteer", locale,
  });
}

export default async function BookVolunteerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ar = locale === "ar";
  const nav = await getTranslations({ locale, namespace: "nav" });
  return <>
    <PageHeader compact title={ar ? "ساهم بوقتك في إحياء الكتب" : "Give books a hand forward"}
      subtitle={ar ? "من جمع الكتب إلى تجهيز الطلبات ورواية قصص الناس، هناك أكثر من طريقة للمساعدة." : "From collecting books to preparing orders and telling community stories, there is a way to help."}
      breadcrumbs={[{ label: nav("home"), href: "/" }, { label: ar ? "إحياء الكتب" : "Book Restore", href: "/book-restore" }, { label: ar ? "التطوع" : "Volunteer" }]} />
    <main className="bg-accent-ice py-14 md:py-20"><Container className="max-w-4xl">
      <div className="mb-8 rounded-2xl border border-brand-blue/15 bg-white p-5 text-sm leading-7 text-text-secondary">
        {ar ? "اختر المجالات التي تهمك وأخبرنا عن وقتك. لا تحتاج إلى خبرة مسبقة لكل مهمة. سيتواصل الفريق معك لتوضيح المسؤوليات والتوقيت قبل بدء أي نشاط." : "Choose the activities that interest you and tell us when you are free. You do not need prior experience for every task. The team will discuss responsibilities and timing with you before any activity begins."}
      </div>
      <BookVolunteerForm locale={ar ? "ar" : "en"} />
    </Container></main>
  </>;
}
