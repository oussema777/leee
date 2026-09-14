"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, PhoneCall, CheckCircle2, Clock3, Copy, Loader2, QrCode, RefreshCw } from "lucide-react";
import { PaymentLoading } from "./PaymentLoading";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import type { PaymentSummary } from "@/lib/book-orders/payment-types";
const digits = (value: string) => value.replace(/\D/g, "");

const copy = {
  en: {
    title: "Complete your Whish payment", reference: "Order reference", total: "Order total",
    intro: "Your order is awaiting payment. Complete the transfer, then submit your payment details for LEE to verify.",
    payTitle: "Pay with Whish", qr: "Scan the permanent QR with Whish", open: "Open payment link", samePhone: "The QR does not fill in the price. Enter the exact order total yourself in Whish, check the recipient, then return here.",
    account: "Receiving account", number: "Account number", amount: "Amount", deadline: "Payment window ends",
    saved: "Keep your private payment link", saveHint: "Use this link to return after switching apps. Anyone with it can access this payment page.",
    copy: "Copy", copyLink: "Copy my payment link", copied: "Copied", copyFailed: "Could not copy automatically. Select and copy the text instead.",
    sent: "I've sent the payment", reportHint: "Submit only after completing the transfer. LEE will check the incoming payment.",
    tx: "Whish transaction reference", sender: "Sender's phone number", senderHint: "Enter the number of the Whish account used to pay, even if someone else paid for you.",
    submit: "Submit for verification", submitting: "Submitting…", review: "Payment details received",
    reviewBody: "Thank you for giving these books a new chapter. Your payment details are now with our team.",
    verified: "Payment received — order confirmed", verifiedBody: "LEE will contact you to arrange the next step for your order.",
    correction: "Please check your payment details", correctionBody: "Read LEE’s note below and correct the payment details. Contact LEE before sending another payment.", expired: "Your payment window has ended",
    expiredBody: "Please contact LEE before sending money. If you already paid, submit the transaction details below.",
    closed: "This order is closed", closedPaid: "Your payment has been received, but this order is closed. Contact LEE to arrange the next step.",
    refunded: "Refund recorded", refundedBody: "LEE has recorded a completed refund. Contact us if you need help.",
    unavailable: "Payment instructions are temporarily unavailable. Contact LEE before sending money.",
    contact: "Contact LEE", check: "Check status", browse: "Back to books", loading: "Loading your payment…",
    missing: "Open the complete private payment link you received at checkout. The order reference alone cannot open this page.",
    error: "We couldn't load your payment. Please try again.", reportError: "We couldn't submit the payment details. Check them and try again.",
    pickup: "Pickup from LEE", delivery: "Delivery", distribution: "LEE distribution", fulfilment: "Fulfilment",
    verification: "Payment is confirmed after LEE verifies your screenshot.", txHint: "Optional. If available, use the reference from your Whish receipt—not the Book Restore order reference.",
  },
  ar: {
    title: "أكمل الدفع عبر Whish", reference: "رقم الطلب", total: "إجمالي الطلب",
    intro: "طلبك بانتظار الدفع. أكمل التحويل ثم أرسل تفاصيل العملية ليتحقق منها فريق LEE.",
    payTitle: "الدفع عبر Whish", qr: "امسح رمز QR الدائم عبر Whish", open: "افتح رابط الدفع", samePhone: "لا يملأ رمز QR السعر تلقائياً. أدخل إجمالي الطلب المحدد بنفسك في Whish، وتحقق من المستلم، ثم عد إلى هنا.",
    account: "الحساب المستلم", number: "رقم الحساب", amount: "المبلغ", deadline: "تنتهي مهلة الدفع في",
    saved: "احتفظ برابط الدفع الخاص بك", saveHint: "استخدم هذا الرابط للعودة بعد الانتقال إلى التطبيق. يمكن لمن يملك الرابط الوصول إلى صفحة الدفع.",
    copy: "انسخ", copyLink: "انسخ رابط الدفع", copied: "تم النسخ", copyFailed: "تعذر النسخ تلقائياً. حدد النص وانسخه يدوياً.",
    sent: "لقد أرسلت الدفعة", reportHint: "أرسل التفاصيل بعد إتمام التحويل فقط. سيتحقق فريق LEE من استلام المبلغ.",
    tx: "رقم عملية الدفع في Whish", sender: "رقم هاتف المرسل", senderHint: "أدخل رقم حساب Whish الذي أُرسلت منه الدفعة، حتى لو دفع شخص آخر عنك.",
    submit: "أرسل للتحقق", submitting: "جارٍ الإرسال…", review: "وصلتنا تفاصيل الدفع",
    reviewBody: "شكراً لمنح هذه الكتب بداية جديدة. وصلت تفاصيل الدفع إلى فريقنا للمراجعة.",
    verified: "تم استلام الدفع وتأكيد الطلب", verifiedBody: "سيتواصل معك فريق LEE لترتيب الخطوة التالية لطلبك.",
    correction: "يرجى مراجعة تفاصيل الدفع", correctionBody: "اقرأ ملاحظة LEE أدناه وصحح تفاصيل العملية. تواصل مع LEE قبل إرسال دفعة أخرى.", expired: "انتهت مهلة الدفع",
    expiredBody: "تواصل مع LEE قبل إرسال المال. إذا كنت قد دفعت بالفعل، أرسل تفاصيل العملية أدناه.",
    closed: "هذا الطلب مغلق", closedPaid: "تم استلام دفعتك لكن هذا الطلب مغلق. تواصل مع LEE لترتيب الخطوة التالية.",
    refunded: "تم تسجيل استرداد المبلغ", refundedBody: "سجل فريق LEE إتمام إعادة المبلغ. تواصل معنا إذا احتجت إلى المساعدة.",
    unavailable: "تعليمات الدفع غير متاحة حالياً. تواصل مع LEE قبل إرسال المال.",
    contact: "تواصل مع LEE", check: "تحقق من الحالة", browse: "العودة إلى الكتب", loading: "جارٍ تحميل تفاصيل الدفع…",
    missing: "افتح رابط الدفع الخاص الكامل الذي حصلت عليه عند الطلب. رقم الطلب وحده لا يفتح هذه الصفحة.",
    error: "تعذر تحميل تفاصيل الدفع. حاول مجدداً.", reportError: "تعذر إرسال تفاصيل الدفع. راجع البيانات وحاول مجدداً.",
    pickup: "استلام من LEE", delivery: "توصيل", distribution: "توزيع عبر LEE", fulfilment: "طريقة الاستلام",
    verification: "يُؤكَّد الدفع بعد تحقق فريق LEE من صورة الإيصال.", txHint: "اختياري. إذا كان متاحاً، استخدم رقم العملية من إيصال Whish وليس رقم طلب الكتب.",
  },
} as const;
const inputClass = "mt-2 w-full rounded-xl border border-surface-tertiary bg-white px-4 py-3 text-accent-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";
const buttonClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-blue-deeper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30 disabled:opacity-50";

export function WhishPaymentPage({ reference, locale }: { reference: string; locale: string }) {
  const ar = locale === "ar"; const t = ar ? copy.ar : copy.en;
  const [stage, setStage] = useState<1 | 2>(1);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const stepHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    try { if (sessionStorage.getItem("whish-stage:" + reference) === "2") setStage(2); } catch {}
  }, [reference]);
  useEffect(() => {
    if (!receipt) { setReceiptPreview(""); return; }
    const url = URL.createObjectURL(receipt); setReceiptPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [receipt]);
  function goToStage(next: 1 | 2) {
    setStage(next); setError(""); setNotice("");
    try { sessionStorage.setItem("whish-stage:" + reference, String(next)); } catch {}
    requestAnimationFrame(() => { stepHeading.current?.focus(); stepHeading.current?.scrollIntoView({ block: "start", behavior: "smooth" }); });
  }
  const [token, setToken] = useState(""); const [ready, setReady] = useState(false);
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false); const [submitting, setSubmitting] = useState(false);
  const [transactionReference, setTransactionReference] = useState(""); const [senderPhone, setSenderPhone] = useState("");
  useEffect(() => {
    let access = window.location.hash.slice(1);
    try {
      if (!access) access = localStorage.getItem("whish-access:" + reference) || "";
      if (/^[a-f0-9]{64}$/.test(access)) localStorage.setItem("whish-access:" + reference, access);
    } catch {}
    setToken(/^[a-f0-9]{64}$/.test(access) ? access : ""); setReady(true);
  }, [reference]);
  const refresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const response = await fetch("/api/public/book-orders/" + encodeURIComponent(reference) + "/payment", { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw Error(ar ? t.error : result.error || t.error);
      setPayment(result); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setRefreshing(false); }
  }, [token, reference, ar, t.error]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const check = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", check);
    const interval = setInterval(() => {
      if (!payment || ["VERIFIED", "REFUNDED"].includes(payment.state)) return;
      check();
    }, 30000);
    return () => { window.removeEventListener("focus", check); clearInterval(interval); };
  }, [refresh, payment]);
  useEffect(() => {
    if (!payment || !["AWAITING_PAYMENT", "CHANGES_REQUESTED"].includes(payment.state)) return;
    const delay = new Date(payment.expiresAt).getTime() - Date.now();
    if (delay <= 0) return;
    const timeout = setTimeout(() => void refresh(), delay + 50);
    return () => clearTimeout(timeout);
  }, [payment, refresh]);
  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice(t.copied); }
    catch { setNotice(t.copyFailed); }
  }
  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting) return;
    if (!receipt) { setError(ar ? "صورة إيصال الدفع مطلوبة." : "A payment screenshot is required."); return; }
    setSubmitting(true); setError("");
    try {
      const form = new FormData();
      form.set("transactionReference", transactionReference); form.set("senderPhone", senderPhone);
      form.set("receipt", receipt);
      const response = await fetch("/api/public/book-orders/" + encodeURIComponent(reference) + "/payment", {
        method: "POST", headers: { Authorization: "Bearer " + token }, body: form,
      });
      const result = await response.json();
      if (!response.ok) throw Error(ar ? t.reportError : result.error || t.reportError);
      setPayment(result); setNotice(""); setReceipt(null);
      requestAnimationFrame(() => { stepHeading.current?.focus(); stepHeading.current?.scrollIntoView({ block: "start", behavior: "smooth" }); });
    } catch (e) { setError(e instanceof Error ? e.message : t.reportError); }
    finally { setSubmitting(false); }
  }
  const closed = payment?.orderStatus === "CANCELLED";
  const expired = payment?.state === "EXPIRED" || payment?.state === "CANCELLED";
  const instructions = payment?.instructions && new Date(payment.expiresAt).getTime() > Date.now() ? payment.instructions : null;
  const support = payment?.supportPhone ? "https://wa.me/" + digits(payment.supportPhone) + "?text=" + encodeURIComponent((ar ? "أحتاج مساعدة في طلب الكتب " : "I need help with book order ") + reference) : null;
  const reportable = !!payment && !["UNDER_REVIEW", "VERIFIED", "REFUNDED"].includes(payment.state);
  const currentStage = !reportable ? 3 : expired || payment?.state === "CHANGES_REQUESTED" ? 2 : stage;
  const heading = !payment ? t.title : payment.state === "VERIFIED" ? closed ? t.closed : t.verified : payment.state === "UNDER_REVIEW" ? t.review : payment.state === "REFUNDED" ? t.refunded : payment.state === "CANCELLED" ? t.closed : expired ? t.expired : payment.state === "CHANGES_REQUESTED" ? t.correction : t.title;
  const body = !payment ? "" : payment.state === "VERIFIED" ? closed ? t.closedPaid : t.verifiedBody : payment.state === "UNDER_REVIEW" ? t.reviewBody : payment.state === "REFUNDED" ? t.refundedBody : expired ? t.expiredBody : payment.state === "CHANGES_REQUESTED" ? t.correctionBody : t.intro;
  return <section className="min-h-[75vh] bg-accent-ice py-6 md:py-10" dir={ar ? "rtl" : "ltr"}>
    <Container className="max-w-5xl">
      <Link href="/books" className="mb-4 inline-block text-sm font-semibold text-brand-blue-deeper underline underline-offset-4">{t.browse}</Link>
      {!ready || (!!token && !payment && !error) ? <PaymentLoading isArabic={ar} /> : !token ? <p role="alert" className="rounded-2xl bg-white p-6">{t.missing}</p> : <>
        <header className="mb-7"><p className="text-xs font-bold uppercase tracking-widest text-brand-blue-deeper">LEE Book Restore</p>
          <h1 ref={stepHeading} tabIndex={-1} className="scroll-mt-28 outline-none mt-3 font-serif text-3xl text-accent-navy md:text-4xl">{heading}</h1>
          {payment?.state === "UNDER_REVIEW" && <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900"><Clock3 className="h-3.5 w-3.5" />{ar ? "بانتظار التحقق" : "Awaiting verification"}</span>}
          {body && <p className="mt-3 max-w-2xl leading-7 text-text-secondary">{body}</p>}
          {payment && <p className="mt-4 text-lg font-bold text-accent-navy">{t.total}: <bdi>{payment.amountCents / 100} USD</bdi></p>}
        </header>
        {payment && <ol aria-label={ar ? "مراحل الدفع" : "Payment progress"} className="mb-7 grid grid-cols-3 gap-2">
          {(ar ? ["الدفع", "تفاصيل العملية", payment.state === "VERIFIED" && !closed ? "تم التأكيد" : "التحقق"] : ["Pay", "Payment details", payment.state === "VERIFIED" && !closed ? "Confirmed" : "Verification"]).map((label, index) => <li key={index} aria-current={currentStage === index + 1 ? "step" : undefined} className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-xs font-bold sm:flex-row sm:justify-center sm:text-sm ${currentStage === index + 1 ? "border-brand-blue bg-accent-navy text-white" : "border-brand-blue/15 bg-white text-text-secondary"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current">{index + 1 < currentStage ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span>{label}</li>)}
        </ol>}
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <p role="status" aria-live="polite" className="mb-3 text-sm text-brand-blue-deeper">{notice}</p>
        {payment && <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {closed && payment.state === "UNDER_REVIEW" && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 leading-7 text-amber-950">{ar ? "هذا الطلب مغلق. تواصل مع LEE لترتيب الخطوة التالية بعد مراجعة الدفعة." : "This order is closed. Contact LEE to arrange the next step after payment review."}</p>}
            {payment.customerNote && <p className="whitespace-pre-wrap rounded-2xl border border-amber-200 bg-amber-50 p-5 leading-7 text-amber-950">{payment.customerNote}</p>}
            {currentStage === 1 && instructions ? <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-serif text-xl text-accent-navy"><QrCode className="h-5 w-5" />{t.payTitle}</h2>
              <div className="mt-5 rounded-2xl border border-brand-blue/15 bg-accent-ice/50 p-4">
                <div className="order-2 sm:order-1">
                  <p className="text-center text-sm font-semibold text-accent-navy">{t.qr}</p>
                  <img src={instructions.imageUrl} alt={ar ? "رمز QR الدائم للدفع عبر Whish" : "Permanent Whish payment QR"} width={320} height={320} className="mx-auto mt-3 aspect-square w-full max-w-80 object-contain" />
                </div>
                  <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">{ar ? <>أدخل المبلغ يدوياً: <bdi>{payment.amountCents / 100} USD</bdi>. إذا اختلف المستلم، توقف وتواصل مع LEE. لا تدفع مرتين.</> : <>Enter this amount manually: <bdi>{payment.amountCents / 100} USD</bdi>. If the recipient differs, stop and contact LEE. Do not pay twice.</>}</p>
              </div>
              <div className="mt-5 flex flex-col gap-5">

                <div className="order-1 sm:order-2">
                  <p className="mb-4 text-sm leading-6 text-text-secondary">{t.samePhone}</p>

                </div>
              </div>
              <dl className="mt-6 space-y-4">
                <div><dt className="text-xs text-text-secondary">{t.account}</dt><dd className="mt-1 font-bold text-accent-navy">{instructions.accountName}</dd></div>
                {[{ label: t.number, value: instructions.accountNumber }, { label: t.amount, value: String(payment.amountCents / 100) }].map(item => <div key={item.label}><dt className="text-xs text-text-secondary">{item.label}</dt><dd className="mt-1 flex items-center gap-2"><span dir="ltr" className="select-all font-bold text-accent-navy">{item.value}{item.label === t.amount ? " USD" : ""}</span><button type="button" aria-label={t.copy + " " + item.label} onClick={() => copyText(item.value)} className="rounded-lg p-3 text-brand-blue-deeper hover:bg-accent-ice"><Copy className="h-4 w-4" /></button></dd></div>)}
              </dl>

              <p className="mt-5 text-xs leading-5 text-text-secondary">{t.verification}</p>
              <button type="button" onClick={() => goToStage(2)} className={buttonClass + " mt-6 w-full"}>{ar ? "لقد دفعت — التالي" : "I've paid — next"}</button>
            </section> : currentStage === 1 && reportable && <div className="rounded-2xl bg-white p-6 leading-7"><p>{t.unavailable}</p><button type="button" className={buttonClass + " mt-4"} onClick={() => goToStage(2)}>{ar ? "دفعت بالفعل؟ أرسل التفاصيل" : "Already paid? Submit details"}</button></div>}
            {payment.state === "UNDER_REVIEW" && <section data-payment-state="UNDER_REVIEW" className="overflow-hidden rounded-3xl border border-brand-blue/10 bg-white shadow-sm">
<div className="bg-accent-navy p-6 text-white sm:p-8">
<div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10"><PhoneCall className="h-6 w-6 text-brand-blue-light" aria-hidden="true" /></span><div><h2 className="font-serif text-2xl">{ar ? "سنتواصل معك" : "We’ll be in touch"}</h2><p className="mt-2 text-sm leading-7 text-white/80">{closed ? (ar ? "سيتصل بك أحد أعضاء فريق LEE على الرقم الذي أدخلته لمراجعة الدفع وترتيب الخطوة التالية لهذا الطلب المغلق." : "A member of the LEE team will call the number you provided to review your payment and discuss the next step for this closed order.") : (ar ? "سيتصل بك أحد أعضاء فريق LEE على الرقم الذي أدخلته للتحقق من الدفع وتأكيد طلبك وترتيب " + (payment.fulfillmentMethod === "PICKUP" ? "الاستلام." : payment.fulfillmentMethod === "DELIVERY" ? "التوصيل." : "توزيع الكتب.") : "A member of the LEE team will call the number you provided to verify your payment, confirm your order and arrange " + (payment.fulfillmentMethod === "PICKUP" ? "pickup." : payment.fulfillmentMethod === "DELIVERY" ? "delivery." : "book distribution."))}</p></div></div>
</div>
<div className="p-6 sm:p-8">
<div className="mb-5 flex items-center justify-between gap-3"><h3 className="font-serif text-xl text-accent-navy">{ar ? "ملخص كتبك" : "Your book recap"}</h3><span className="rounded-full bg-accent-ice px-3 py-1 text-xs font-bold text-brand-blue-deeper">{payment.bookCount} {ar ? "كتاب" : payment.bookCount === 1 ? "book" : "books"}</span></div>
{payment.selectionMode === "LEE_CHOICE" ? <div className="flex items-center gap-4 rounded-2xl bg-accent-ice p-5"><BookOpen className="h-8 w-8 shrink-0 text-brand-blue" /><p className="text-sm leading-6 text-text-secondary">{ar ? "سيختار فريق LEE كتباً مناسبة للتوزيع نيابةً عنك." : "LEE will choose suitable books to distribute on your behalf."}</p></div> : payment.books?.length ? <ul className="max-h-80 space-y-4 overflow-y-auto pe-1">{payment.books.map(book => <li key={book.id} className="flex items-center gap-4 rounded-2xl border border-brand-blue/10 p-3">
<div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent-ice">{book.coverImageUrl ? <img src={book.coverImageUrl} alt="" width={56} height={80} className="h-full w-full object-cover" /> : <BookOpen className="h-6 w-6 text-brand-blue/60" aria-hidden="true" />}</div>
<div className="min-w-0"><p className="font-serif text-lg leading-6 text-accent-navy">{ar ? book.titleAr || book.title : book.title}</p>{(book.author || book.authorAr) && <p className="mt-1 text-xs text-text-secondary">{ar ? book.authorAr || book.author : book.author || book.authorAr}</p>}<p className="mt-1 text-xs font-semibold text-brand-blue-deeper">{book.editionLabel || (ar ? "الطبعة القياسية" : "Standard edition")}{book.editionYear ? ` (${book.editionYear})` : ""}</p>{book.isFreeExtra && <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{ar ? "كتاب إضافي مجاني" : "Free extra book"}</span>}</div>
</li>)}</ul> : <p className="rounded-xl bg-accent-ice p-4 text-sm text-text-secondary">{ar ? "سيؤكد فريقنا اختيار الكتب معك خلال الاتصال." : "Our team will confirm your book selection with you on the call."}</p>}
<dl className="mt-6 grid gap-4 border-t border-brand-blue/10 pt-5 sm:grid-cols-2">
<div><dt className="text-xs text-text-secondary">{t.tx}</dt><dd dir="ltr" className="mt-1 break-all text-sm font-semibold text-accent-navy">{payment.submittedReference || "—"}</dd></div>
<div><dt className="text-xs text-text-secondary">{ar ? "المبلغ قيد التحقق" : "Amount awaiting verification"}</dt><dd className="mt-1 text-sm font-semibold text-accent-navy"><bdi>{payment.amountCents / 100} USD</bdi></dd></div>
</dl>
<p className="mt-6 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-950"><Clock3 className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />{ar ? "لم يُؤكَّد الدفع بعد. لا تدفع مرة أخرى أثناء مراجعة الفريق للعملية." : "Payment is still being verified. Please don’t pay again while our team reviews the transfer."}</p>
</div>
</section>}
            {payment.state === "VERIFIED" && <CheckCircle2 className="h-14 w-14 text-emerald-600" aria-hidden="true" />}
            {reportable && currentStage === 2 && <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="font-serif text-2xl text-accent-navy">{ar ? "أرسل تفاصيل الدفع" : "Submit your payment details"}</h2><p className="mt-2 text-sm leading-6 text-text-secondary">{t.reportHint}</p>
              <form onSubmit={report} className="mt-6 space-y-5">
                <label className="block text-sm font-semibold text-accent-navy">{t.tx} <span className="font-normal text-text-secondary">({ar ? "اختياري" : "optional"})</span><input value={transactionReference} onChange={e => setTransactionReference(e.target.value)} minLength={3} maxLength={100} dir="ltr" autoComplete="off" className={inputClass} /><span className="mt-2 block text-xs font-normal leading-5 text-text-secondary">{t.txHint}</span></label>
                <label className="block text-sm font-semibold text-accent-navy">{t.sender}<input type="tel" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} required minLength={6} maxLength={30} dir="ltr" autoComplete="tel" className={inputClass} /><span className="mt-2 block text-xs font-normal leading-5 text-text-secondary">{t.senderHint}</span></label>
                <div className="rounded-xl border border-dashed border-brand-blue/40 bg-accent-ice p-4">
<label className="block text-sm font-semibold text-accent-navy">{ar ? "صورة إيصال الدفع (مطلوبة)" : "Payment screenshot (required)"}
<input type="file" accept="image/jpeg,image/png,image/webp" required={!receipt} disabled={submitting} className="mt-3 block w-full text-xs file:me-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold" onChange={event => {
  const file = event.target.files?.[0] || null; setError("");
  if (file && (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024)) {
    setError(ar ? "اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 2 ميغابايت." : "Choose a JPG, PNG or WebP image up to 2 MB."); event.target.value = ""; setReceipt(null); return;
  }
  setReceipt(file);
}} /></label>
<p className="mt-2 text-xs leading-5 text-text-secondary">{ar ? "أرفق إيصال العملية فقط، دون الرصيد أو عمليات أخرى. الصورة متاحة لفريق مراجعة الدفع فقط. الحد الأقصى 2 ميغابايت." : "Attach this transaction's receipt only; crop out your balance and other payments. Only payment reviewers can view it. Maximum 2 MB."}</p>
{receiptPreview && <><img src={receiptPreview} alt={ar ? "معاينة إيصال الدفع" : "Payment screenshot preview"} className="mt-4 max-h-64 w-full rounded-lg object-contain" /><button type="button" disabled={submitting} onClick={() => { setReceipt(null); const input = document.querySelector<HTMLInputElement>('input[type="file"]'); if (input) input.value = ""; }} className="mt-2 min-h-11 text-sm font-semibold underline">{ar ? "إزالة الصورة" : "Remove screenshot"}</button></>}
</div>
<p className="text-xs leading-5 text-text-secondary">{t.verification}</p>
<button disabled={submitting || !receipt} className={buttonClass + " w-full"}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{submitting ? t.submitting : t.submit}</button>
              </form>
              {!expired && payment.state !== "CHANGES_REQUESTED" && <button type="button" disabled={submitting} onClick={() => goToStage(1)} className="mt-4 min-h-11 text-sm font-bold text-brand-blue-deeper">{ar ? "رجوع إلى تعليمات الدفع" : "Back to payment instructions"}</button>}
            </section>}
          </div>
          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="rounded-2xl bg-accent-navy p-6 text-white"><p className="text-sm text-white/70">{t.total}</p><p className="mt-2 text-4xl font-bold" dir="ltr">{payment.amountCents / 100} <span className="text-base">USD</span></p>
              <p className="mt-6 text-xs text-white/65">{t.reference}</p><p dir="ltr" className="mt-1 break-all font-semibold">{reference}</p>
              <p className="mt-5 text-xs text-white/65">{t.fulfilment}</p><p className="mt-1 text-sm">{payment.fulfillmentMethod === "PICKUP" ? t.pickup : payment.fulfillmentMethod === "DELIVERY" ? t.delivery : t.distribution}</p>
              {instructions && <><p className="mt-5 text-xs text-white/65">{t.deadline}</p><p className="mt-1 text-sm">{new Date(payment.expiresAt).toLocaleString(ar ? "ar-LB" : "en-GB")}</p></>}
            </div>
            <div className="rounded-2xl bg-white p-5"><h2 className="font-semibold text-accent-navy">{t.saved}</h2><p className="mt-2 text-xs leading-5 text-text-secondary">{t.saveHint}</p><button onClick={() => copyText(window.location.origin + "/" + (ar ? "ar" : "en") + "/books/payment/" + encodeURIComponent(reference) + "#" + token)} className="mt-4 flex min-h-11 items-center gap-2 text-sm font-bold text-brand-blue-deeper"><Copy className="h-4 w-4" />{t.copyLink}</button></div>
            {support ? <a href={support} target="_blank" rel="noopener noreferrer" className={buttonClass + " w-full"}>{t.contact}</a> : <Link href="/contact" className={buttonClass + " w-full"}>{t.contact}</Link>}
          </aside>
        </div>}
        <button onClick={() => void refresh()} disabled={refreshing} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl border border-brand-blue/30 px-5 py-3 text-sm font-bold text-brand-blue-deeper disabled:opacity-50"><RefreshCw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")} />{t.check}</button>
      </>}
    </Container>
  </section>;
}
