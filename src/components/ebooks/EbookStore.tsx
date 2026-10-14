"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, FileText, Languages, Library, Tablet } from "lucide-react";
import { EbookOrderDialog } from "./EbookOrderDialog";
import { ProductSkeleton } from "./EbookSkeleton";
import { EbookImage } from "./EbookImage";
import { ebookFetch, money } from "./client";
import p from "./purchase.module.css";
import s from "./ebooks.module.css";

export type EbookProduct = {
  id: string; slug: string; titleEn: string; titleAr: string;
  descriptionEn: string; descriptionAr: string; author: string;
  coverUrl: string; priceCents: number; language: string;
  activeVersion: { pageCount: number };
};
type Catalog = { ebooks: EbookProduct[]; methods: string[]; testMode?: boolean };
const languageNames: Record<string, [string, string]> = { ARABIC: ["Arabic", "العربية"], ENGLISH: ["English", "الإنجليزية"], FRENCH: ["French", "الفرنسية"], OTHER: ["Other", "أخرى"] };

export function EbookStore({ locale, slug }: { locale: string; slug: string }) {
  const ar = locale === "ar";
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const load = useCallback(async () => {
    setError("");
    try { setCatalog(await ebookFetch<Catalog>("/api/ebooks/catalog")); }
    catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const book = catalog?.ebooks.find(b => b.slug === slug);
  const title = book ? ar ? book.titleAr || book.titleEn : book.titleEn : "";
  const steps = ar ? [
    ["اربط بريدك", "اضغط «اطلب الكتاب الإلكتروني» وأكّد بريدك برمز دخول. ستجد كتابك دائماً في مكتبتك بهذا البريد."],
    ["ادفع وأرسل المرجع", "اختر طريقة الدفع، واتبع تفاصيل التحويل، ثم أرسل مرجع العملية للمراجعة."],
    ["ابدأ القراءة بعد التأكيد", "بعد التحقق من استلام الدفعة، يصلك رابط القراءة على بريدك. افتح الكتاب من «كتبي الإلكترونية»."],
  ] : [
    ["Connect your email", "Choose Order ebook and verify your email with a code. Your book will belong to the library linked to that email."],
    ["Pay & submit your reference", "Choose a payment method, follow the transfer instructions, then submit your transaction reference for review."],
    ["Read after approval", "Once we confirm your payment, we’ll email your reading link. Open your book anytime from My ebooks."],
  ];
  return <main className={p.page} dir={ar ? "rtl" : "ltr"}>
    <div className={p.wrap}>
      <nav className={p.nav} aria-label={ar ? "روابط الكتب" : "Book navigation"}>
        <Link href={`/${locale}/books`}><ArrowLeft size={16} className="rtl:rotate-180" aria-hidden="true" />{ar ? "متجر الكتب" : "Book store"}</Link>
        <Link href={`/${locale}/ebooks/library`}><Library size={16} aria-hidden="true" />{ar ? "كتبي الإلكترونية" : "My ebooks"}</Link>
      </nav>
      {catalog?.testMode && <p className={p.paused} style={{ marginBottom: 24 }}>{ar ? "اختبار مؤقت: رموز الدفع الحالية غير معتمدة بعد. الطلبات والبريد والوصول تُسجَّل في قاعدة بيانات الموقع الفعلية." : "Temporary test mode: the saved payment QRs are not yet validated. Orders, emails and reading access use the real website database."}</p>}
      {error ? <div role="alert" className={s.error}>{error} <button className={p.textButton} onClick={() => void load()}>{ar ? "إعادة المحاولة" : "Retry"}</button></div>
        : !catalog ? <ProductSkeleton ar={ar} />
        : !book ? <div className={s.empty}><h1>{ar ? "الكتاب غير متاح حالياً" : "This ebook is currently unavailable"}</h1><Link href={`/${locale}/books`} className={s.button}>{ar ? "العودة إلى المتجر" : "Back to the book store"}</Link></div>
        : <>
          <div className={p.hero}>
            <div className={p.coverStage}>
              {book.coverUrl ? <EbookImage key={book.coverUrl} src={book.coverUrl} alt={ar ? `غلاف ${title}` : `Cover of ${title}`} ar={ar} className={p.coverMedia} /> : <div className={s.placeholder}>{title}</div>}
              <p className={p.coverCaption}><Tablet size={17} aria-hidden="true" />{ar ? "نسخة إلكترونية للقراءة على الموقع" : "Digital edition · Read on this website"}</p>
            </div>
            <section className={p.intro} aria-labelledby="ebook-title">
              <span className={p.format}><Tablet size={16} aria-hidden="true" />{ar ? "كتاب إلكتروني" : "Ebook"}</span>
              <h1 id="ebook-title">{title}</h1>
              <p className={p.author}>{ar ? "بقلم" : "by"} {book.author}</p>
              <p className={p.description}>{ar ? book.descriptionAr || book.descriptionEn : book.descriptionEn}</p>
              <div className={p.specs}>
                <span><Languages size={16} aria-hidden="true" />{languageNames[book.language]?.[ar ? 1 : 0] || book.language}</span>
                <span><FileText size={16} aria-hidden="true" />{book.activeVersion.pageCount} {ar ? "صفحة" : "pages"}</span>
                <span><BookOpen size={16} aria-hidden="true" />{ar ? "قراءة على الموقع" : "Online reading"}</span>
              </div>
              <div className={p.priceRow}><strong className={p.price}>{money(book.priceCents)}</strong><div><small>{ar ? "دولار أمريكي · دفعة واحدة" : "USD · One-time purchase"}</small><small>{ar ? "دون رسوم شحن" : "No shipping charges"}</small></div></div>
              <button className={p.primary} onClick={() => setOrdering(true)} aria-haspopup="dialog">{ar ? "اطلب الكتاب الإلكتروني" : "Order ebook"}<ArrowRight size={19} className="rtl:rotate-180" aria-hidden="true" /></button>
              <p className={p.promise}><CheckCircle2 size={17} aria-hidden="true" />{ar ? "وصول شخصي للقراءة بعد التحقق من الدفع. القراءة على الموقع فقط، دون ملف للتنزيل." : "Personal reading access after payment approval. Read here on the website; no downloadable file."}</p>
              {!catalog.methods.length && <p className={p.paused}>{ar ? "الدفع متوقف مؤقتاً. يمكنك ربط بريدك، لكن لا يمكن إتمام الطلب إلى حين تأكيد طرق الدفع." : "Payments are currently paused. You can connect your email, but ordering can’t be completed until a payment method is confirmed."}</p>}
            </section>
          </div>
          <section className={p.how} aria-labelledby="ebook-how-title">
            <h2 id="ebook-how-title">{ar ? "من الطلب إلى أول صفحة" : "From your order to your first page"}</h2>
            <ol className={p.explain}>{steps.map(([heading, text], i) => <li key={heading}><span>{i + 1}</span><h3>{heading}</h3><p>{text}</p></li>)}</ol>
          </section>
          <details className={p.faq}><summary>{ar ? "كيف أقرأ الكتاب بعد شرائه؟" : "How do I read my ebook after buying it?"}</summary><p>{ar ? "بعد موافقة فريقنا على الدفع، سجّل الدخول ببريد الشراء من «كتبي الإلكترونية». يمكنك القراءة على هاتفك أو جهازك اللوحي أو الكمبيوتر مع الاتصال بالإنترنت، وحفظ موضع القراءة تلقائياً. لا يتضمن الشراء نسخة ورقية أو ملف PDF للتنزيل." : "Once our team approves your payment, sign in with your purchase email under My ebooks. Read on your phone, tablet or computer with an internet connection, and pick up from your saved page. This purchase does not include a printed copy or a PDF download."}</p></details>
          {ordering && <EbookOrderDialog book={book} locale={locale} onClose={() => setOrdering(false)} />}
        </>}
    </div>
  </main>;
}
