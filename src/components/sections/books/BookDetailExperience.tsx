"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookHeart,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  Gift,
  HandHeart,
  HeartHandshake,
  Home,
  Languages,
  MapPin,
  PackageCheck,
  Search,
  Sparkles,
  Tag,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { BOOK_PACKAGES, type BookPackageKey } from "@/lib/book-orders/config";
import type { CatalogueBook } from "./BooksCatalogue";

type Step = "package" | "purpose" | "books" | "checkout" | "success";
type Purpose = "SELF" | "GIFT" | "DONATION";
type SelectionMode = "CUSTOM" | "LEE_CHOICE";

const packageKeys = Object.keys(BOOK_PACKAGES) as BookPackageKey[];

const copy = {
  en: {
    back: "Back to all books",
    by: "by",
    available: "Available",
    unavailable: "Unavailable",
    language: "Language",
    condition: "Condition",
    category: "Category",
    order: "Order this book",
    starting: "Starting at $5 · cash payment available",
    impactTitle: "Every book opens two doors.",
    impactBody: "You give a rescued book a new reader while helping fund vocational training for a woman or displaced young person.",
    related: "More books you may love",
    close: "Close order",
    packageTitle: "How many books would you like?",
    packageIntro: "This book is already your first selection. Choose one book or make a bigger impact with a pack.",
    choose: "Choose",
    selected: "Selected",
    continue: "Continue",
    oneBook: "1 book",
    fiveBooks: "5 books",
    tenBooks: "10 books + 1 free extra book",
    twentyBooks: "20 books + 2 free extra books",
    impact1: "Funds one hour of vocational training",
    impact5: "Funds a complete training session",
    impact10: "Funds training for two people",
    impact20: "Funds training for four people",
    purposeTitle: "What would you like to do with the books?",
    purposeIntro: "Choose one option. We’ll only ask for the information needed for it.",
    selfTitle: "Order for myself",
    selfBody: "Have the books delivered to you or collect them from LEE.",
    giftTitle: "Send as a gift",
    giftBody: "Send them to someone you know with a free personal gift card.",
    donateTitle: "Donate through LEE",
    donateBody: "LEE will place the books with readers who can benefit from them.",
    leeChoose: "Let LEE choose suitable books",
    leeChooseHint: "Fastest · your current book is saved as a preference",
    chooseMyself: "I want to choose every book",
    booksTitle: "Build your book selection",
    booksProgress: (chosen: number, total: number) => `${chosen} of ${total} selected`,
    booksRemaining: (remaining: number) => remaining === 1 ? "Choose 1 more book" : `Choose ${remaining} more books`,
    search: "Search by title or author",
    freeExtra: "Free extra",
    remove: "Remove",
    add: "Add book",
    full: "Selection full",
    checkoutTitle: "Complete your order",
    checkoutIntro: "Review your choices and tell us where the books should go.",
    change: "Change",
    orderSummary: "Order summary",
    cash: "Cash",
    customerDetails: "Your details",
    fullName: "Full name",
    phone: "Phone number",
    email: "Email (optional)",
    fulfillment: "How would you like to receive it?",
    delivery: "Delivery",
    pickup: "Pick up from LEE",
    address: "Delivery address",
    governorate: "Governorate",
    area: "Area / city",
    detailedAddress: "Street, building, floor and directions",
    recipient: "Gift recipient",
    recipientName: "Recipient’s name",
    recipientPhone: "Recipient’s phone",
    giftCard: "Free gift card",
    giftMessage: "Write your message (optional)",
    showName: "Show my name on the card",
    cashCod: "Pay in cash when your order is delivered or collected.",
    cashArrange: "LEE will contact you to arrange cash payment before the gift is sent.",
    cashDonate: "LEE will contact you to arrange cash payment and book distribution.",
    consent: "I confirm the order details and agree that LEE may contact me to fulfil this order.",
    placeOrder: "Place cash order",
    placing: "Placing your order…",
    successTitle: "Your next chapter is reserved.",
    successGift: "Your gift is reserved.",
    successDonation: "Thank you for sharing the gift of reading.",
    reference: "Order reference",
    successBody: "LEE will contact you shortly to confirm payment and fulfilment details.",
    keepBrowsing: "Continue browsing books",
    error: "We couldn’t place the order. Please check the details and try again.",
  },
  ar: {
    back: "العودة إلى جميع الكتب",
    by: "بقلم",
    available: "متاح",
    unavailable: "غير متاح",
    language: "اللغة",
    condition: "الحالة",
    category: "التصنيف",
    order: "اطلب هذا الكتاب",
    starting: "ابتداءً من ٥$ · الدفع النقدي متاح",
    impactTitle: "كل كتاب يفتح بابين.",
    impactBody: "تمنح كتابًا مستعادًا قارئًا جديدًا، وتساهم في تمويل تدريب مهني لامرأة أو شاب نازح.",
    related: "كتب أخرى قد تعجبك",
    close: "إغلاق الطلب",
    packageTitle: "كم كتابًا تريد؟",
    packageIntro: "هذا الكتاب هو اختيارك الأول. اختر كتابًا واحدًا أو باقة ذات أثر أكبر.",
    choose: "اختر",
    selected: "تم الاختيار",
    continue: "متابعة",
    oneBook: "كتاب واحد",
    fiveBooks: "٥ كتب",
    tenBooks: "١٠ كتب + كتاب إضافي مجاني",
    twentyBooks: "٢٠ كتابًا + كتابان إضافيان مجانًا",
    impact1: "تموّل ساعة تدريب مهني",
    impact5: "تموّل جلسة تدريب كاملة",
    impact10: "تموّل تدريب شخصين",
    impact20: "تموّل تدريب أربعة أشخاص",
    purposeTitle: "ماذا تريد أن تفعل بالكتب؟",
    purposeIntro: "اختر خيارًا واحدًا، وسنطلب فقط المعلومات اللازمة له.",
    selfTitle: "أطلبها لنفسي",
    selfBody: "استلم الكتب بالتوصيل أو من مركز LEE.",
    giftTitle: "أرسلها هدية",
    giftBody: "أرسلها لشخص تعرفه مع بطاقة مجانية ورسالة شخصية.",
    donateTitle: "أتبرع بها عبر LEE",
    donateBody: "ستوصل LEE الكتب إلى قرّاء يمكنهم الاستفادة منها.",
    leeChoose: "دع LEE تختار الكتب المناسبة",
    leeChooseHint: "الأسرع · سنحفظ كتابك الحالي كتفضيل",
    chooseMyself: "أريد اختيار كل كتاب بنفسي",
    booksTitle: "كوّن مجموعتك",
    booksProgress: (chosen: number, total: number) => `اخترت ${chosen} من ${total}`,
    booksRemaining: (remaining: number) => remaining === 1 ? "اختر كتابًا إضافيًا" : `اختر ${remaining} كتب إضافية`,
    search: "ابحث بالعنوان أو اسم المؤلف",
    freeExtra: "إضافي مجاني",
    remove: "إزالة",
    add: "أضف الكتاب",
    full: "اكتمل الاختيار",
    checkoutTitle: "أكمل طلبك",
    checkoutIntro: "راجع اختياراتك وأخبرنا إلى أين يجب أن تذهب الكتب.",
    change: "تعديل",
    orderSummary: "ملخص الطلب",
    cash: "نقدًا",
    customerDetails: "بياناتك",
    fullName: "الاسم الكامل",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني (اختياري)",
    fulfillment: "كيف تريد استلام الطلب؟",
    delivery: "توصيل",
    pickup: "استلام من LEE",
    address: "عنوان التوصيل",
    governorate: "المحافظة",
    area: "المنطقة / المدينة",
    detailedAddress: "الشارع، المبنى، الطابق وإرشادات الوصول",
    recipient: "مستلم الهدية",
    recipientName: "اسم المستلم",
    recipientPhone: "رقم هاتف المستلم",
    giftCard: "بطاقة هدية مجانية",
    giftMessage: "اكتب رسالتك (اختياري)",
    showName: "أظهر اسمي على البطاقة",
    cashCod: "ادفع نقدًا عند توصيل الطلب أو استلامه.",
    cashArrange: "ستتواصل معك LEE لترتيب الدفع النقدي قبل إرسال الهدية.",
    cashDonate: "ستتواصل معك LEE لترتيب الدفع النقدي وتوزيع الكتب.",
    consent: "أؤكد تفاصيل الطلب وأوافق على تواصل LEE معي لإتمامه.",
    placeOrder: "تأكيد الطلب النقدي",
    placing: "جارٍ إرسال طلبك…",
    successTitle: "تم حجز فصلك القادم.",
    successGift: "تم حجز هديتك.",
    successDonation: "شكرًا لمشاركة هدية القراءة.",
    reference: "رقم الطلب",
    successBody: "ستتواصل معك LEE قريبًا لتأكيد الدفع وتفاصيل التسليم.",
    keepBrowsing: "متابعة تصفح الكتب",
    error: "تعذر إرسال الطلب. تحقق من البيانات وحاول مرة أخرى.",
  },
} as const;

const packageCopy = {
  SINGLE: ["oneBook", "impact1"],
  FIVE: ["fiveBooks", "impact5"],
  TEN_PLUS_ONE: ["tenBooks", "impact10"],
  TWENTY_PLUS_TWO: ["twentyBooks", "impact20"],
} as const;

function localTitle(book: CatalogueBook, isArabic: boolean) {
  return isArabic && book.titleAr ? book.titleAr : book.title;
}

function localAuthor(book: CatalogueBook, isArabic: boolean) {
  return isArabic && book.authorAr ? book.authorAr : book.author;
}

function prettyValue(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-accent-navy">{label}{required && <span className="text-red-500"> *</span>}{children}</label>;
}

const fieldClass = "mt-2 h-12 w-full rounded-xl border border-surface-tertiary bg-white px-4 text-sm text-text-primary outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10";

export function BookDetailExperience({ book, books, locale }: { book: CatalogueBook; books: CatalogueBook[]; locale: string }) {
  const isArabic = locale === "ar";
  const t: Record<string, any> = isArabic ? copy.ar : copy.en;
  const title = localTitle(book, isArabic);
  const author = localAuthor(book, isArabic);
  const description = isArabic ? book.descriptionAr || book.descriptionEn : book.descriptionEn || book.descriptionAr;
  const available = book.status === "AVAILABLE" && book.stockQuantity > 0;
  const related = books.filter((item) => item.id !== book.id).slice(0, 3);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("package");
  const [packageKey, setPackageKey] = useState<BookPackageKey>("SINGLE");
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("CUSTOM");
  const [selectedIds, setSelectedIds] = useState<string[]>([book.id]);
  const [query, setQuery] = useState("");
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !submitting) setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", closeOnEscape); };
  }, [open, submitting]);

  const activePackage = packageKey ? BOOK_PACKAGES[packageKey] : null;
  const selectedBooks = selectedIds.map((id) => books.find((item) => item.id === id)).filter(Boolean) as CatalogueBook[];
  const remaining = activePackage ? Math.max(0, activePackage.totalBooks - selectedIds.length) : 0;
  const filteredBooks = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    return books.filter((item) => {
      if (item.status !== "AVAILABLE" || item.stockQuantity < 1) return false;
      return !normalized || [item.title, item.titleAr, item.author, item.authorAr].filter(Boolean).join(" ").toLocaleLowerCase(locale).includes(normalized);
    });
  }, [books, locale, query]);

  function resetAndOpen() {
    setStep("package");
    setPackageKey("SINGLE");
    setPurpose(null);
    setSelectionMode("CUSTOM");
    setSelectedIds([book.id]);
    setError("");
    setReference("");
    setOpen(true);
  }

  function afterPurpose() {
    if (!packageKey || !purpose) return;
    if (purpose === "DONATION" && selectionMode === "LEE_CHOICE") setStep("checkout");
    else if (BOOK_PACKAGES[packageKey].totalBooks > 1) setStep("books");
    else setStep("checkout");
  }

  function toggleBook(id: string) {
    if (!activePackage) return;
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= activePackage.totalBooks) return current;
      return [...current, id];
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!packageKey || !purpose || !consent) return;
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const isLeeChoice = purpose === "DONATION" && selectionMode === "LEE_CHOICE";
    const response = await fetch("/api/public/book-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: isArabic ? "ar" : "en",
        package: packageKey,
        purpose,
        selectionMode: isLeeChoice ? "LEE_CHOICE" : "CUSTOM",
        selectedBookIds: isLeeChoice ? selectedIds.slice(0, 1) : selectedIds,
        customerName: data.get("customerName"),
        customerPhone: data.get("customerPhone"),
        customerEmail: data.get("customerEmail"),
        fulfillmentMethod: purpose === "DONATION" ? "LEE_DISTRIBUTION" : purpose === "GIFT" ? "DELIVERY" : fulfillment,
        governorate: data.get("governorate"),
        area: data.get("area"),
        detailedAddress: data.get("detailedAddress"),
        recipientName: data.get("recipientName"),
        recipientPhone: data.get("recipientPhone"),
        giftMessage: data.get("giftMessage"),
        showSenderName: data.get("showSenderName") === "on",
        paymentMethod: purpose === "SELF" ? "CASH_ON_DELIVERY" : "CASH_ARRANGEMENT",
        website: data.get("website"),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(typeof result.error === "string" ? result.error : t.error);
      setSubmitting(false);
      return;
    }
    setReference(result.reference);
    setStep("success");
    setSubmitting(false);
  }

  const stepNumber = step === "package" ? 1 : step === "purpose" ? 2 : step === "books" ? 3 : 4;

  return (
    <main className="min-h-screen bg-surface-primary">
      <section className="relative overflow-hidden bg-accent-navy text-white">
        <div className="pointer-events-none absolute -end-40 -top-48 h-96 w-96 rounded-full bg-brand-blue/20 blur-3xl" />
        <Container className="relative py-8 md:py-12">
          <Link href="/books" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white">
            {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}{t.back}
          </Link>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(320px,0.8fr)_1.2fr] lg:gap-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-white/10 shadow-2xl ring-1 ring-white/15">
              {book.coverImageUrl ? <Image src={book.coverImageUrl} alt={isArabic ? `غلاف كتاب ${title}` : `Cover of ${title}`} fill priority sizes="(max-width: 1024px) 90vw, 420px" className="object-cover" /> : <div className="flex h-full items-center justify-center p-10 text-center"><BookOpen className="mx-auto mb-5 h-14 w-14 text-brand-blue-light" /><p className="font-serif text-3xl">{title}</p></div>}
              <span className={`absolute start-5 top-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-lg ${available ? "bg-emerald-600" : "bg-slate-600"}`}>{available && <Check className="h-4 w-4" />}{available ? t.available : t.unavailable}</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: isArabic ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="mb-5 flex flex-wrap gap-2"><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">{prettyValue(book.category)}</span><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">{prettyValue(book.condition)}</span></div>
              <h1 className="max-w-3xl font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
              <p className="mt-4 text-lg text-white/65">{t.by} {author}</p>
              {description && <p className="mt-7 max-w-2xl text-base leading-8 text-white/75">{description}</p>}
              <div className="mt-8 grid max-w-xl grid-cols-3 border-y border-white/15 py-5 text-sm"><div><Languages className="mb-2 h-4 w-4 text-brand-blue-light"/><span className="block text-xs text-white/45">{t.language}</span><strong className="mt-1 block">{prettyValue(book.language)}</strong></div><div><Tag className="mb-2 h-4 w-4 text-brand-blue-light"/><span className="block text-xs text-white/45">{t.condition}</span><strong className="mt-1 block">{prettyValue(book.condition)}</strong></div><div><BookOpen className="mb-2 h-4 w-4 text-brand-blue-light"/><span className="block text-xs text-white/45">{t.category}</span><strong className="mt-1 block">{prettyValue(book.category)}</strong></div></div>
              <button type="button" onClick={resetAndOpen} disabled={!available} className="mt-8 inline-flex min-h-14 w-full max-w-xl items-center justify-center gap-3 rounded-2xl bg-brand-blue px-7 py-4 text-base font-bold text-white shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"><BookHeart className="h-5 w-5"/>{t.order}</button>
              <p className="mt-3 text-sm text-white/55">{t.starting}</p>
            </motion.div>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16"><Container><div className="grid gap-8 rounded-[2rem] bg-white p-7 shadow-sm md:grid-cols-[auto_1fr] md:items-center md:p-10"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue-light text-brand-blue-deeper"><HeartHandshake className="h-8 w-8"/></div><div><h2 className="font-serif text-3xl text-accent-navy">{t.impactTitle}</h2><p className="mt-2 max-w-3xl leading-7 text-text-secondary">{t.impactBody}</p></div></div></Container></section>

      {related.length > 0 && <section className="pb-16"><Container><h2 className="mb-7 font-serif text-3xl text-accent-navy">{t.related}</h2><div className="grid gap-5 sm:grid-cols-3">{related.map((item) => <Link key={item.id} href={`/books/${item.slug}`} className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-secondary">{item.coverImageUrl ? <Image src={item.coverImageUrl} alt="" fill sizes="80px" className="object-cover"/> : <BookOpen className="absolute inset-0 m-auto h-7 w-7 text-accent-navy/35"/>}</div><div><h3 className="font-serif text-lg leading-snug text-text-primary group-hover:text-brand-blue-deeper">{localTitle(item, isArabic)}</h3><p className="mt-2 text-xs text-text-muted">{localAuthor(item, isArabic)}</p></div></Link>)}</div></Container></section>}

      <AnimatePresence>
        {open && <motion.div className="fixed inset-0 z-[100] flex items-end justify-center bg-accent-navy/70 p-0 backdrop-blur-sm md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setOpen(false); }}>
          <motion.section role="dialog" aria-modal="true" aria-label={t.checkoutTitle} className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] bg-accent-ice shadow-2xl md:rounded-[2rem]" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 30 }}>
            <header className="flex items-center justify-between border-b border-surface-tertiary bg-white px-5 py-4 md:px-7"><div className="flex items-center gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue-deeper"><BookHeart className="h-5 w-5"/></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-deeper">LEE Book Restore</p>{step !== "success" && <div className="mt-1 flex items-center gap-1.5" aria-label={`Step ${stepNumber} of 4`}>{[1,2,3,4].map((number) => <span key={number} className={`h-1.5 rounded-full transition-all ${number <= stepNumber ? "w-7 bg-brand-blue" : "w-3 bg-surface-tertiary"}`}/>)}</div>}</div></div><button type="button" onClick={() => setOpen(false)} disabled={submitting} aria-label={t.close} className="rounded-full p-2 text-text-secondary transition hover:bg-surface-secondary hover:text-text-primary"><X className="h-5 w-5"/></button></header>

            <div className="overflow-y-auto p-5 md:p-8">
              <AnimatePresence mode="wait" initial={false}>
                {step === "package" && <motion.div key="package" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><h2 className="font-serif text-3xl text-accent-navy md:text-4xl">{t.packageTitle}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">{t.packageIntro}</p><div className="mt-7 grid gap-4 sm:grid-cols-2">{packageKeys.map((key) => { const details = BOOK_PACKAGES[key]; const labels = packageCopy[key]; const active = packageKey === key; return <button type="button" key={key} onClick={() => { setPackageKey(key); setSelectedIds([book.id]); }} className={`relative rounded-2xl border-2 p-5 text-start transition-all hover:-translate-y-0.5 hover:shadow-lg ${active ? "border-brand-blue bg-white shadow-lg shadow-brand-blue/10" : "border-transparent bg-white hover:border-brand-blue/30"}`}><div className="flex items-start justify-between gap-4"><div><p className="font-serif text-2xl text-accent-navy">{t[labels[0]]}</p><p className="mt-2 text-sm leading-6 text-text-secondary">{t[labels[1]]}</p></div><span className="rounded-xl bg-accent-navy px-3 py-2 text-lg font-bold text-white">${details.priceCents / 100}</span></div>{details.freeBooks > 0 && <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900"><Sparkles className="h-3.5 w-3.5"/>{details.freeBooks} {t.freeExtra}</span>}{active && <motion.span layoutId="package-check" className="absolute -end-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue text-white"><Check className="h-4 w-4"/></motion.span>}</button>; })}</div><div className="mt-7 flex justify-end"><button type="button" disabled={!packageKey} onClick={() => setStep("purpose")} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-navy px-6 py-3 font-bold text-white transition hover:bg-brand-blue-deeper disabled:opacity-40">{t.continue}{isArabic ? <ChevronLeft className="h-4 w-4"/> : <ArrowRight className="h-4 w-4"/>}</button></div></motion.div>}

                {step === "purpose" && <motion.div key="purpose" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><h2 className="font-serif text-3xl text-accent-navy md:text-4xl">{t.purposeTitle}</h2><p className="mt-3 text-sm text-text-secondary">{t.purposeIntro}</p><div className="mt-7 grid gap-4 md:grid-cols-3">{([{ key: "SELF", icon: Home, title: t.selfTitle, body: t.selfBody }, { key: "GIFT", icon: Gift, title: t.giftTitle, body: t.giftBody }, { key: "DONATION", icon: HandHeart, title: t.donateTitle, body: t.donateBody }] as const).map((option) => { const active = purpose === option.key; return <motion.button whileHover={{ y: -4 }} whileTap={{ scale: .98 }} type="button" key={option.key} onClick={() => { setPurpose(option.key); setSelectionMode(option.key === "DONATION" ? "LEE_CHOICE" : "CUSTOM"); }} className={`rounded-2xl border-2 bg-white p-5 text-start transition-colors ${active ? "border-brand-blue shadow-lg shadow-brand-blue/10" : "border-transparent hover:border-brand-blue/30"}`}><motion.span animate={active ? { rotate: [0, -7, 7, 0], scale: [1, 1.12, 1] } : {}} className={`flex h-14 w-14 items-center justify-center rounded-2xl ${active ? "bg-brand-blue text-white" : "bg-brand-blue-light text-brand-blue-deeper"}`}><option.icon className="h-7 w-7"/></motion.span><h3 className="mt-5 font-serif text-xl text-accent-navy">{option.title}</h3><p className="mt-2 text-sm leading-6 text-text-secondary">{option.body}</p>{active && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 flex items-center gap-2 text-xs font-bold text-brand-blue-deeper"><CheckCircle2 className="h-4 w-4"/>{t.selected}</motion.div>}</motion.button>; })}</div>{purpose === "DONATION" && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5 grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2"><button type="button" onClick={() => setSelectionMode("LEE_CHOICE")} className={`rounded-xl border-2 p-4 text-start ${selectionMode === "LEE_CHOICE" ? "border-brand-blue bg-brand-blue-light/50" : "border-surface-tertiary"}`}><strong className="flex items-center gap-2 text-sm text-accent-navy"><Sparkles className="h-4 w-4 text-brand-blue"/>{t.leeChoose}</strong><span className="mt-1 block text-xs text-text-secondary">{t.leeChooseHint}</span></button><button type="button" onClick={() => setSelectionMode("CUSTOM")} className={`rounded-xl border-2 p-4 text-start text-sm font-bold text-accent-navy ${selectionMode === "CUSTOM" ? "border-brand-blue bg-brand-blue-light/50" : "border-surface-tertiary"}`}>{t.chooseMyself}</button></motion.div>}<div className="mt-7 flex items-center justify-between"><button type="button" onClick={() => setStep("package")} className="px-3 py-2 text-sm font-bold text-text-secondary">{t.back}</button><button type="button" disabled={!purpose} onClick={afterPurpose} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-navy px-6 py-3 font-bold text-white transition hover:bg-brand-blue-deeper disabled:opacity-40">{t.continue}{isArabic ? <ChevronLeft className="h-4 w-4"/> : <ArrowRight className="h-4 w-4"/>}</button></div></motion.div>}

                {step === "books" && activePackage && <motion.div key="books" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-serif text-3xl text-accent-navy md:text-4xl">{t.booksTitle}</h2><p className="mt-2 text-sm font-bold text-brand-blue-deeper" aria-live="polite">{t.booksProgress(selectedIds.length, activePackage.totalBooks)} · {remaining ? t.booksRemaining(remaining) : t.full}</p></div><div className="min-w-40 rounded-xl bg-accent-navy px-4 py-3 text-center text-white"><span className="text-2xl font-bold tabular-nums">{selectedIds.length}/{activePackage.totalBooks}</span></div></div><div className="mt-5 flex gap-2 overflow-x-auto pb-2">{selectedBooks.map((item, index) => <motion.div layout key={item.id} className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-secondary ring-2 ring-white shadow"><button type="button" onClick={() => toggleBook(item.id)} aria-label={`${t.remove} ${localTitle(item, isArabic)}`} className="absolute end-1 top-1 z-10 rounded-full bg-accent-navy/90 p-1 text-white"><X className="h-3 w-3"/></button>{item.coverImageUrl ? <Image src={item.coverImageUrl} alt="" fill sizes="64px" className="object-cover"/> : <BookOpen className="absolute inset-0 m-auto h-5 w-5 text-accent-navy/30"/>}{activePackage.freeBooks > 0 && index >= activePackage.paidBooks && <span className="absolute bottom-0 inset-x-0 bg-amber-400 px-1 py-0.5 text-center text-[8px] font-bold text-amber-950">{t.freeExtra}</span>}</motion.div>)}</div><label className="relative mt-5 block"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className={`${fieldClass} mt-0 ps-11`}/></label><div className="mt-5 grid max-h-[42vh] gap-3 overflow-y-auto pe-1 sm:grid-cols-2 lg:grid-cols-3">{filteredBooks.map((item) => { const active = selectedIds.includes(item.id); const disabled = !active && remaining === 0; return <button type="button" key={item.id} disabled={disabled} onClick={() => toggleBook(item.id)} className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-3 text-start transition ${active ? "border-brand-blue shadow-sm" : "border-transparent hover:border-brand-blue/30 disabled:opacity-45"}`}><div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-secondary">{item.coverImageUrl ? <Image src={item.coverImageUrl} alt="" fill sizes="64px" className="object-cover"/> : <BookOpen className="absolute inset-0 m-auto h-5 w-5 text-accent-navy/30"/>}</div><div className="min-w-0"><strong className="line-clamp-2 font-serif text-base text-accent-navy">{localTitle(item, isArabic)}</strong><span className="mt-1 block truncate text-xs text-text-muted">{localAuthor(item, isArabic)}</span><span className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${active ? "text-red-600" : "text-brand-blue-deeper"}`}>{active ? <><X className="h-3 w-3"/>{t.remove}</> : <><Check className="h-3 w-3"/>{t.add}</>}</span></div></button>; })}</div><div className="mt-7 flex items-center justify-between"><button type="button" onClick={() => setStep("purpose")} className="px-3 py-2 text-sm font-bold text-text-secondary">{t.back}</button><button type="button" disabled={remaining !== 0} onClick={() => setStep("checkout")} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-navy px-6 py-3 font-bold text-white transition hover:bg-brand-blue-deeper disabled:opacity-40">{t.continue}{isArabic ? <ChevronLeft className="h-4 w-4"/> : <ArrowRight className="h-4 w-4"/>}</button></div></motion.div>}

                {step === "checkout" && activePackage && purpose && <motion.div key="checkout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><h2 className="font-serif text-3xl text-accent-navy md:text-4xl">{t.checkoutTitle}</h2><p className="mt-2 text-sm text-text-secondary">{t.checkoutIntro}</p><form onSubmit={submitOrder} className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]"><div className="space-y-6"><section className="rounded-2xl bg-white p-5"><h3 className="font-serif text-xl text-accent-navy">{t.customerDetails}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label={t.fullName} required><input name="customerName" required maxLength={120} autoComplete="name" className={fieldClass}/></Field><Field label={t.phone} required><input name="customerPhone" required maxLength={30} inputMode="tel" autoComplete="tel" className={fieldClass}/></Field><Field label={t.email}><input name="customerEmail" type="email" maxLength={254} autoComplete="email" className={fieldClass}/></Field><input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true"/></div></section>{purpose === "SELF" && <section className="rounded-2xl bg-white p-5"><h3 className="font-serif text-xl text-accent-navy">{t.fulfillment}</h3><div className="mt-4 grid grid-cols-2 gap-3">{([{ key: "DELIVERY", icon: Truck, label: t.delivery }, { key: "PICKUP", icon: MapPin, label: t.pickup }] as const).map((option) => <button type="button" key={option.key} onClick={() => setFulfillment(option.key)} className={`rounded-xl border-2 p-4 text-start text-sm font-bold ${fulfillment === option.key ? "border-brand-blue bg-brand-blue-light/50 text-accent-navy" : "border-surface-tertiary text-text-secondary"}`}><option.icon className="mb-2 h-5 w-5"/>{option.label}</button>)}</div></section>}{purpose === "GIFT" && <section className="rounded-2xl bg-white p-5"><h3 className="flex items-center gap-2 font-serif text-xl text-accent-navy"><Gift className="h-5 w-5 text-brand-blue"/>{t.recipient}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label={t.recipientName} required><input name="recipientName" required maxLength={120} className={fieldClass}/></Field><Field label={t.recipientPhone} required><input name="recipientPhone" required maxLength={30} inputMode="tel" className={fieldClass}/></Field></div><div className="mt-5 rounded-2xl bg-brand-blue-light/50 p-4"><h4 className="flex items-center gap-2 text-sm font-bold text-accent-navy"><Sparkles className="h-4 w-4 text-brand-blue"/>{t.giftCard}</h4><textarea name="giftMessage" maxLength={300} rows={3} placeholder={t.giftMessage} className={`${fieldClass} h-auto resize-none py-3`}/><label className="mt-3 flex items-center gap-2 text-sm text-text-secondary"><input name="showSenderName" type="checkbox" defaultChecked className="h-4 w-4 accent-brand-blue"/>{t.showName}</label></div></section>}{purpose !== "DONATION" && (purpose === "GIFT" || fulfillment === "DELIVERY") && <section className="rounded-2xl bg-white p-5"><h3 className="font-serif text-xl text-accent-navy">{t.address}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label={t.governorate} required><input name="governorate" required maxLength={80} autoComplete="address-level1" className={fieldClass}/></Field><Field label={t.area} required><input name="area" required maxLength={120} autoComplete="address-level2" className={fieldClass}/></Field><div className="sm:col-span-2"><Field label={t.detailedAddress} required><textarea name="detailedAddress" required maxLength={500} rows={3} autoComplete="street-address" className={`${fieldClass} h-auto resize-none py-3`}/></Field></div></div></section>}</div><aside className="lg:sticky lg:top-0 lg:self-start"><div className="rounded-2xl bg-accent-navy p-5 text-white"><div className="flex items-center justify-between"><h3 className="font-serif text-xl">{t.orderSummary}</h3><button type="button" onClick={() => setStep("package")} className="text-xs font-bold text-brand-blue-light underline underline-offset-4">{t.change}</button></div><div className="mt-5 flex items-end justify-between border-b border-white/15 pb-5"><div><p className="text-sm font-bold">{t[packageCopy[packageKey][0]]}</p><p className="mt-1 text-xs text-white/55">{purpose === "SELF" ? t.selfTitle : purpose === "GIFT" ? t.giftTitle : t.donateTitle}</p></div><strong className="text-2xl">${activePackage.priceCents / 100}</strong></div><div className="mt-5 flex -space-x-2 rtl:space-x-reverse">{selectionMode === "LEE_CHOICE" ? <div className="flex h-12 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs"><Sparkles className="h-4 w-4 text-brand-blue-light"/>{t.leeChoose}</div> : selectedBooks.slice(0, 6).map((item) => <div key={item.id} className="relative h-12 w-9 overflow-hidden rounded-md bg-white/10 ring-2 ring-accent-navy">{item.coverImageUrl && <Image src={item.coverImageUrl} alt="" fill sizes="36px" className="object-cover"/>}</div>)}</div><div className="mt-5 rounded-xl bg-white/10 p-4"><div className="flex items-center gap-2 text-sm font-bold"><PackageCheck className="h-5 w-5 text-brand-blue-light"/>{t.cash}</div><p className="mt-2 text-xs leading-5 text-white/65">{purpose === "SELF" ? t.cashCod : purpose === "GIFT" ? t.cashArrange : t.cashDonate}</p></div></div><label className="mt-4 flex items-start gap-3 rounded-xl bg-white p-4 text-sm leading-6 text-text-secondary"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required className="mt-1 h-4 w-4 shrink-0 accent-brand-blue"/>{t.consent}</label>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button type="submit" disabled={!consent || submitting} className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-3 font-bold text-white shadow-lg transition hover:bg-brand-blue-dark disabled:opacity-50">{submitting ? t.placing : t.placeOrder}{!submitting && <ArrowRight className="h-4 w-4 rtl:rotate-180"/>}</button><button type="button" onClick={() => setStep(activePackage.totalBooks > 1 && selectionMode === "CUSTOM" ? "books" : "purpose")} className="mt-2 w-full px-3 py-2 text-sm font-bold text-text-secondary">{t.back}</button></aside></form></motion.div>}

                {step === "success" && <motion.div key="success" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-xl py-10 text-center"><motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: .15 }} className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-12 w-12"/></motion.div><h2 className="mt-7 font-serif text-4xl text-accent-navy">{purpose === "GIFT" ? t.successGift : purpose === "DONATION" ? t.successDonation : t.successTitle}</h2><p className="mt-4 leading-7 text-text-secondary">{t.successBody}</p><div className="mx-auto mt-6 max-w-sm rounded-2xl border border-dashed border-brand-blue bg-white p-5"><span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t.reference}</span><strong className="mt-2 block text-xl tracking-wide text-accent-navy">{reference}</strong></div><button type="button" onClick={() => setOpen(false)} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-navy px-6 py-3 font-bold text-white hover:bg-brand-blue-deeper">{t.keepBrowsing}<BookOpen className="h-4 w-4"/></button></motion.div>}
              </AnimatePresence>
            </div>
          </motion.section>
        </motion.div>}
      </AnimatePresence>
    </main>
  );
}
