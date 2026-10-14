"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { ReaderLogin } from "./ReaderLogin";
import { EbookJourney } from "./EbookJourney";
import { OrderFormSkeleton } from "./EbookSkeleton";
import { EbookClientError, ebookFetch, money } from "./client";
import type { EbookProduct } from "./EbookStore";
import s from "./ebooks.module.css";
import p from "./purchase.module.css";

type Library = { access: { ebook: { id: string } }[]; orders: { id: string; ebookId: string; state: string }[] };
export function EbookOrderDialog({ book, locale, onClose }: { book: EbookProduct; locale: string; onClose: () => void }) {
  const ar = locale === "ar";
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useRef(true);
  const attempt = useRef(0);
  const submitting = useRef(false);
  const [step, setStep] = useState<"checking" | "email" | "details">("checking");
  const [email, setEmail] = useState("");
  const [methods, setMethods] = useState<string[]>([]);
  const [method, setMethod] = useState("");
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [testMode, setTestMode] = useState(false);

  // Recheck purchases on every attempt. Authentication never creates an order.
  async function continueOrder() {
    const currentAttempt = ++attempt.current;
    const current = () => mounted.current && attempt.current === currentAttempt;
    setStep("checking"); setError(""); setReady(false);
    try {
      const [session, catalog, library] = await Promise.all([
        ebookFetch<{ reader: { email: string } | null }>("/api/ebooks/auth"),
        ebookFetch<{ ebooks: EbookProduct[]; methods: string[]; testMode?: boolean }>("/api/ebooks/catalog"),
        ebookFetch<Library>("/api/ebooks/orders").catch(e => {
          if (e instanceof EbookClientError && e.status === 401) return null;
          throw e;
        }),
      ]);
      if (!current()) return;
      setMethods(catalog.methods);
      setTestMode(!!catalog.testMode);
      setMethod(current => catalog.methods.includes(current) ? current : catalog.methods[0] || "");
      if (!session.reader || !library) { setEmail(""); setReady(true); setStep("email"); return; }
      setEmail(session.reader.email);
      if (library.access.some(a => a.ebook.id === book.id)) { router.push(`/${locale}/ebooks/read/${book.id}`); return; }
      const existing = library.orders.find(o => o.ebookId === book.id && ["AWAITING_PAYMENT", "UNDER_REVIEW", "CHANGES_REQUESTED", "VERIFIED"].includes(o.state));
      if (existing) { router.push(`/${locale}/ebooks/orders/${existing.id}`); return; }
      if (!catalog.ebooks.some(b => b.id === book.id)) throw Error(ar ? "هذا الكتاب غير متاح للطلب حالياً." : "This ebook is no longer available to order.");
      setReady(true); setStep("details");
    } catch (e) {
      if (!current()) return;
      if (e instanceof EbookClientError && e.status === 401) { setEmail(""); setStep("email"); }
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    mounted.current = true;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const nativeDialog = dialog.current;
    nativeDialog?.showModal();
    void continueOrder();
    return () => { mounted.current = false; nativeDialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
    // A fresh dialog is mounted for each order attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    dialog.current?.querySelector<HTMLElement>(step === "email" ? "[data-autofocus]" : "[data-step-heading]")?.focus();
  }, [step]);

  async function changeEmail() {
    setBusy(true); setError("");
    try {
      await ebookFetch("/api/ebooks/auth", {}, "DELETE");
      if (mounted.current) { setEmail(""); setAccepted(false); setStep("email"); }
    } catch (e) { if (mounted.current) setError((e as Error).message); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function checkout() {
    if (!ready || !methods.includes(method) || !accepted || submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const order = await ebookFetch<{ id: string }>("/api/ebooks/orders", { ebookId: book.id, customerName: name, method, locale, termsAccepted: accepted });
      if (mounted.current) router.push(`/${locale}/ebooks/orders/${order.id}`);
    } catch (e) {
      if (!mounted.current) return;
      if (e instanceof EbookClientError && e.status === 401) { setEmail(""); setStep("email"); }
      setError((e as Error).message);
      submitting.current = false; setBusy(false);
    }
  }
  return <dialog ref={dialog} className={p.dialog} dir={ar ? "rtl" : "ltr"} aria-labelledby="ebook-order-title"
    onKeyDown={e => {
      if (e.key !== "Tab") return;
      const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(el => el.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || !items.includes(document.activeElement as HTMLElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }}
    onCancel={e => { e.preventDefault(); if (!submitting.current) onClose(); }}
    onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); if (e.target === e.currentTarget && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) && !submitting.current) onClose(); }}>
    <header className={p.dialogHeader}>
      <h2 id="ebook-order-title">{ar ? "طلب الكتاب الإلكتروني" : "Order your ebook"}</h2>
      <button className={p.close} type="button" aria-label={ar ? "إغلاق" : "Close order"} disabled={submitting.current} onClick={onClose}><X size={19} /></button>
    </header>
    <div className={p.dialogBody}>
      <EbookJourney step={submitting.current ? 3 : step === "details" ? 2 : 1} ar={ar} />
      {testMode && <p className={p.paused}>{ar ? "اختبار مؤقت باستخدام رموز الدفع غير المعتمدة. سيُوسم الطلب بأنه اختبار." : "Temporary test using unvalidated payment QRs. Your order will be marked as a test."}</p>}
      <div className={p.summary}>
        {book.coverUrl && <img src={book.coverUrl} alt="" />}
        <div><strong>{ar ? book.titleAr || book.titleEn : book.titleEn}</strong><small>{ar ? "كتاب إلكتروني · قراءة على الموقع" : "Ebook · Online reading"}</small></div>
        <b>{money(book.priceCents)}</b>
      </div>
      {error && <div role="alert" className={s.error}>{error} <button type="button" className={p.textButton} onClick={() => void continueOrder()} disabled={busy}>{ar ? "إعادة المحاولة" : "Try again"}</button></div>}
      {step === "checking" || submitting.current ? (error ? <p className={p.status}>{ar ? "تعذّرت المتابعة. أعد المحاولة." : "We couldn’t continue. Please try again."}</p> : <OrderFormSkeleton ar={ar} payment={submitting.current} />) : <>
        {!methods.length && <p className={p.paused} role="status">{ar ? "الدفع متوقف مؤقتاً إلى حين تأكيد طرق الدفع. يمكنك ربط بريدك الآن، لكن لا يمكن إتمام الطلب بعد." : "Payments are temporarily paused while we confirm the payment methods. You can connect your email, but can’t place an order yet."}</p>}
        {step === "email" ? <div style={{ marginTop: methods.length ? 0 : 24 }}><ReaderLogin locale={locale} checkout onSuccess={() => void continueOrder()} /></div> : <>
          <h3 data-step-heading tabIndex={-1} style={{ marginTop: methods.length ? 0 : 24 }}>{ar ? "راجع طلبك" : "Review your order"}</h3>
          <p className={p.help}>{ar ? "اختر طريقة الدفع. في الخطوة التالية ستظهر تفاصيل التحويل وإرسال مرجعه للمراجعة." : "Choose how to pay. Next, we’ll show the transfer instructions and where to submit your payment reference."}</p>
          <div className={p.email}><CheckCircle2 size={17} aria-hidden="true" /><span dir="ltr">{email}</span><button type="button" disabled={busy} className={p.textButton} onClick={() => void changeEmail()}>{ar ? "تغيير البريد" : "Change email"}</button></div>
          <form className={s.form} onSubmit={e => { e.preventDefault(); void checkout(); }}>
            <label>{ar ? "الاسم الكامل" : "Full name"}<input autoComplete="name" value={name} minLength={2} maxLength={120} required disabled={busy} onChange={e => setName(e.target.value)} /></label>
            {!!methods.length && <fieldset disabled={busy}><legend className={p.legend}>{ar ? "طريقة الدفع" : "Payment method"}</legend><div className={p.choices}>{methods.map(value => <label key={value} className={p.choice}><input type="radio" name="ebook-payment" value={value} checked={method === value} onChange={() => setMethod(value)} /><span>{value === "WHISH" ? "Whish" : "Bank Audi"}<small>{ar ? "تحويل بالدولار" : "USD transfer"}</small></span></label>)}</div></fieldset>}
            <label className={s.check}><input type="checkbox" required checked={accepted} disabled={busy || !methods.length} onChange={e => setAccepted(e.target.checked)} /><span>{ar ? "أفهم أن هذا وصول شخصي للقراءة على الموقع، دون ملف للتنزيل. تبدأ القراءة بعد التحقق من الدفع." : "I understand this is personal online reading access, with no downloadable file. Reading starts after payment verification."}</span></label>
            <div className={p.total}><span>{ar ? "الإجمالي · دفعة واحدة" : "Total · One-time payment"}</span><strong>{money(book.priceCents)}</strong></div>
            <button className={p.primary} disabled={busy || !methods.length || !ready}>{busy ? (ar ? "جارٍ فتح صفحة الدفع…" : "Opening payment…") : (ar ? "متابعة إلى الدفع" : "Continue to payment")}<ArrowRight size={17} className="rtl:rotate-180" aria-hidden="true" /></button>
            <p className={p.help} style={{ margin: 0 }}>{ar ? "لن يُخصم أي مبلغ هنا. ستجري التحويل بنفسك في الخطوة التالية." : "Nothing is charged here. You’ll make the transfer yourself in the next step."}</p>
          </form>
        </>}
      </>}
      <div style={{ marginTop: 22 }}><Link className={p.textButton} href={`/${locale}/ebooks/library`}>{ar ? "لديك كتاب بالفعل؟ افتح مكتبتك" : "Already own an ebook? Open your library"}</Link></div>
    </div>
  </dialog>;
}
