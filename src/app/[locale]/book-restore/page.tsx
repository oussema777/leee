import { BookOpenCheck, ClipboardCheck, MessagesSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { BookDonationForm } from "@/components/sections/book-restore/BookDonationForm";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata({
    title: locale === "ar" ? "تبرّع بالكتب — تجربة LEE" : "Donate Books — The LEE Experience",
    description: locale === "ar"
      ? "سجّل كتبك التي لم تعد بحاجة إليها، وسيتواصل معك فريق LEE لتنسيق الخطوة التالية."
      : "Register books you no longer need and the LEE team will contact you to coordinate the next step.",
    path: "book-restore",
    locale,
  });
}

export default async function BookRestorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const nav = await getTranslations({ locale, namespace: "nav" });
  const stages = isAr
    ? [
        { title: "سجّل الكتب", text: "أخبرنا عنك وعن مجموعة الكتب بشكل تقديري.", icon: ClipboardCheck },
        { title: "ننسّق معك", text: "يراجع الفريق الطلب ويتواصل معك لتأكيد طريقة التسليم.", icon: MessagesSquare },
        { title: "نراجع ونوجّه", text: "تُراجع الكتب وقد تُوجّه لإعادة البيع أو الاستخدام المجتمعي أو التدوير المسؤول.", icon: BookOpenCheck },
      ]
    : [
        { title: "Register the books", text: "Tell us about you and the collection using simple estimates.", icon: ClipboardCheck },
        { title: "We coordinate", text: "The team reviews your request and contacts you to confirm the handover.", icon: MessagesSquare },
        { title: "We review and route", text: "Books are reviewed and may go to resale, community use, or responsible recycling.", icon: BookOpenCheck },
      ];

  return (
    <>
      <PageHeader
        compact
        title={isAr ? "تبرّع بكتبك... وخلي قصتها تكمّل" : "Give your books another chapter"}
        subtitle={isAr
          ? "عملية واضحة تبدأ بالتسجيل، ثم التأكيد، ثم تسليم الكتب."
          : "A clear process from registration and confirmation to book handover."}
        breadcrumbs={[
          { label: nav("home"), href: "/" },
          { label: nav("getInvolved"), href: "/get-involved" },
          { label: isAr ? "تبرّع بالكتب" : "Donate Books" },
        ]}
      />

      <main>
        <section className="py-14 md:py-20">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 items-start">
              <div className="lg:sticky lg:top-28">
                <h2 className="font-serif text-3xl md:text-4xl text-accent-navy tracking-[-0.02em]">
                  {isAr ? "من رفّك إلى فصل جديد" : "From your shelf to a new chapter"}
                </h2>
                <p className="mt-4 text-text-secondary leading-7 max-w-[62ch]">
                  {isAr
                    ? "املأ النموذج بمعلومات تقريبية. لا يعني التسجيل قبول جميع الكتب؛ سيتواصل معك الفريق بعد المراجعة لتأكيد الخطوة التالية."
                    : "Share a practical estimate through the form. Registration does not guarantee that every book will be accepted; our team will review it and confirm the next step."}
                </p>
                <ol className="mt-9 space-y-7">
                  {stages.map(({ title, text, icon: Icon }, index) => (
                    <li key={title} className="grid grid-cols-[2.75rem_1fr] gap-4">
                      <div className="relative flex justify-center">
                        <span className="flex size-11 items-center justify-center rounded-full bg-accent-navy text-white">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        {index < stages.length - 1 && <span className="absolute top-12 bottom-[-1.55rem] w-px bg-surface-tertiary" />}
                      </div>
                      <div className="pt-1">
                        <h3 className="font-semibold text-accent-navy">{title}</h3>
                        <p className="mt-1 text-sm leading-6 text-text-secondary">{text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div id="donation-form" className="rounded-2xl bg-white p-5 shadow-[0_18px_45px_-28px_rgba(27,58,92,0.45)] sm:p-8 md:p-10">
                <BookDonationForm locale={isAr ? "ar" : "en"} />
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-accent-navy py-10 text-white">
          <Container>
            <div className="mx-auto max-w-4xl md:flex md:items-start md:justify-between md:gap-12">
              <h2 className="font-serif text-2xl md:text-3xl">
                {isAr ? "قبل أن ترسل الطلب" : "Before you submit"}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:mt-0">
                {isAr
                  ? "لا ترسل صوراً أو مستندات شخصية. سنستخدم بياناتك للتواصل بشأن هذا التبرع فقط وفق إشعار الخصوصية المعتمد. إذا واجهت مشكلة، تواصل معنا عبر صفحة الاتصال."
                  : "Do not send personal photos or identity documents. We will use your details only to follow up on this donation under the approved privacy notice. If you need help, please use our contact page."}
              </p>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
