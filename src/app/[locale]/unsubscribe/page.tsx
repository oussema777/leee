import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "unsubscribe" });
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <section
      dir={dir}
      className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-slate-50"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 sm:p-10 text-center shadow-xl ring-1 ring-slate-200">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-emerald-600"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          {t("body")}
        </p>
      </div>
    </section>
  );
}
