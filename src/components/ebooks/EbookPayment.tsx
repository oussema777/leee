"use client";
import { CustomerCardCheckout } from "@/components/books/CustomerCardCheckout";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ReaderLogin } from "./ReaderLogin";
import { EbookJourney } from "./EbookJourney";
import { PaymentSkeleton } from "./EbookSkeleton";
import { EbookImage } from "./EbookImage";
import { EbookClientError, ebookFetch, money, stateLabel } from "./client";
import s from "./ebooks.module.css";
import p from "./purchase.module.css";
type Order = {
  cardCheckout?: boolean;
  testOrder?: boolean;
  testMode?: boolean;
  title: string;
  reference: string;
  state: string;
  method: string;
  priceCents: number;
  ebookId: string;
  customerNote: string;
  submittedReference: string | null;
  canSubmit: boolean;
  access: boolean;
  hasReceipt: boolean;
  supportPhone: string;
  instructions: {
    accountName: string;
    accountNumber: string;
    iban?: string;
    imageUrl: string;
  } | null;
};
export function EbookPayment({ locale, id }: { locale: string; id: string }) {
  const ar = locale === "ar";
  const [auth, setAuth] = useState<boolean | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const load = useCallback(async () => {
    setError("");
    setRefreshing(true);
    try {
      // The order endpoint already authenticates ownership. Avoid a serial
      // session request before fetching the same protected information.
      const data = await ebookFetch<Order>(`/api/ebooks/orders/${id}`);
      setAuth(true);
      setOrder(data);
      setReference(data.submittedReference || "");
    } catch (e) {
      if (e instanceof EbookClientError && e.status === 401) { setAuth(false); setOrder(null); }
      else setError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("transactionReference", reference);
      if (receipt) form.set("receipt", receipt);
      await ebookFetch(`/api/ebooks/orders/${id}`, form);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (order?.cardCheckout) return <main className={s.shell}><CustomerCardCheckout endpoint={`/api/ebooks/orders/${id}/card`} reference={order.reference} amountCents={order.priceCents} locale={locale} readingUrl={`/${locale}/ebooks/read/${order.ebookId}`} /></main>;
  return (
    <main className={s.shell} dir={ar ? "rtl" : "ltr"}>
      <div className={s.top}>
        <Link href={`/${locale}/ebooks/library`} className={s.secondary}>
          {ar ? "كتبي الإلكترونية" : "My ebooks"}
        </Link>
        <button className={s.secondary} disabled={refreshing || busy} onClick={() => void load()}>
          {refreshing ? (ar ? "جارٍ التحديث…" : "Refreshing…") : (ar ? "تحديث الحالة" : "Refresh status")}
        </button>
      </div>
      <h1>{order?.access ? (ar ? "كتابك جاهز للقراءة" : "Your ebook is ready") : order?.state === "UNDER_REVIEW" ? (ar ? "دفعتك قيد المراجعة" : "Your payment is under review") : order?.canSubmit ? (ar ? "أكمل عملية الدفع" : "Complete your payment") : (ar ? "طلب الكتاب الإلكتروني" : "Your ebook order")}</h1>
      {(order?.testOrder || order?.testMode) && <p className={p.paused}>{ar ? "اختبار مؤقت للدفع. رموز الدفع غير معتمدة بعد؛ فتح الرمز لا يؤكد الدفع. يبقى تفعيل القراءة بعد مراجعة الإدارة." : "Temporary payment testing. These QRs are not yet validated; opening a QR does not confirm payment. Reading access still requires admin approval."}</p>}
      {order && <div className={p.paymentJourney}>
        <EbookJourney step={order.access ? 4 : 3} ar={ar} />
        <p>{order.access
          ? (ar ? "تم تأكيد الدفع. اضغط «اقرأ كتابك» لبدء القراءة." : "Payment confirmed. Choose Read your ebook to open your first page.")
          : order.state === "UNDER_REVIEW"
            ? (ar ? "وصلنا مرجع الدفع. لا تدفع مرة أخرى؛ سنرسل رابط القراءة بعد التأكيد." : "We have your payment reference. Don’t pay again; we’ll email your reading link after approval.")
            : order.canSubmit
              ? (ar ? "حوّل المبلغ، ثم أرسل مرجع العملية أدناه. تبدأ القراءة بعد التحقق من الدفع." : "Make your transfer, then submit the transaction reference below. Reading begins after payment approval.")
              : (ar ? "تابع حالة طلبك أدناه أو تواصل مع الدعم للمساعدة." : "Check your order status below or contact support for help.")}</p>
      </div>}
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {auth === false ? (
        <ReaderLogin locale={locale} onSuccess={() => void load()} />
      ) : !order ? (
        error ? <button className={s.secondary} onClick={() => void load()} disabled={refreshing}>{ar ? "إعادة المحاولة" : "Retry loading payment"}</button> : <PaymentSkeleton ar={ar} />
      ) : (
        <div className={s.split}>
          <section className={s.card}>
            <span className={s.badge}>{stateLabel(order.state, ar)}</span>
            <h2 style={{ marginTop: 20 }}>{order.title}</h2>
            <p className={s.muted}>{order.reference}</p>
            <p className={s.price}>{money(order.priceCents)}</p>
            <p>{order.method === "WHISH" ? "Whish" : "Bank Audi"}</p>
            {order.customerNote && (
              <p className={s.notice}>{order.customerNote}</p>
            )}
            {order.state === "UNDER_REVIEW" && (
              <p className={s.notice}>
                {ar
                  ? "دفعتك بانتظار التحقق. بعد التأكيد سنرسل إليك رابط القراءة على الموقع."
                  : "Your payment is awaiting verification. Once confirmed, we’ll email you access to read your ebook on our website."}
              </p>
            )}
            {order.access && order.state === "VERIFIED" && (
              <Link
                className={s.button}
                href={`/${locale}/ebooks/read/${order.ebookId}`}
              >
                {ar ? "اقرأ كتابك" : "Read your ebook"}
              </Link>
            )}
            {order.state === "VERIFIED" && !order.access && (
              <p className={s.notice}>
                {ar
                  ? "تم تعليق الوصول. تواصل معنا للمساعدة."
                  : "Reading access is suspended. Please contact us for help."}
              </p>
            )}
            {order.supportPhone && (
              <p style={{ marginTop: 24 }}>
                <a
                  href={`https://wa.me/${order.supportPhone.replace(/\D/g, "")}`}
                  className={s.secondary}
                >
                  {ar ? "المساعدة عبر واتساب" : "Payment support"}
                </a>
              </p>
            )}
          </section>
          <section className={s.card}>
            {order.instructions ? (
              <>
                <h2>{ar ? "تفاصيل التحويل" : "Transfer details"}</h2>
                <p>
                  {ar
                    ? "حوّل المبلغ المحدد وأضف رقم الطلب إلى ملاحظات التحويل. تحقّق من إتمام الدفع قبل الإرسال."
                    : "Transfer the exact amount and include your order reference in the transfer notes. Check that payment completed before submitting."}
                </p>
                <dl className={s.details}>
                  <div>
                    <dt>{ar ? "المستفيد" : "Beneficiary"}</dt>
                    <dd>{order.instructions.accountName}</dd>
                  </div>
                  <div>
                    <dt>{ar ? "رقم الحساب" : "Account number"}</dt>
                    <dd dir="ltr">{order.instructions.accountNumber}</dd>
                  </div>
                  {order.instructions.iban && (
                    <div>
                      <dt>IBAN</dt>
                      <dd dir="ltr">{order.instructions.iban}</dd>
                    </div>
                  )}
                </dl>
                {order.instructions.imageUrl && <details style={{ marginBottom: 24 }} onToggle={event => setQrOpen(event.currentTarget.open)}>
                  <summary style={{ cursor: "pointer" }}>{ar ? "عرض رمز الدفع (اختياري)" : "Show payment QR (optional)"}</summary>
                  {qrOpen && <div style={{ marginTop: 12 }}><EbookImage key={order.instructions.imageUrl} src={order.instructions.imageUrl} alt={ar ? "رمز الدفع" : "Payment QR"} ar={ar} className={s.qr} lazy /></div>}
                </details>}
              </>
            ) : (
              order.canSubmit && (
                <p className={s.notice}>
                  {ar
                    ? "تعليمات الدفع غير متاحة حالياً. تواصل معنا قبل إجراء تحويل جديد. إذا دفعت بالفعل، يمكنك إرسال المرجع أدناه."
                    : "Payment instructions are currently unavailable. Contact support before making a new transfer. If you already paid, submit your reference below."}
                </p>
              )
            )}
            {order.canSubmit ? (
              <form
                className={s.form}
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <label>
                  {ar ? "مرجع عملية الدفع" : "Payment transaction reference"}
                  <input
                    required
                    minLength={3}
                    maxLength={100}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </label>
                <label>
                  {ar
                    ? "إيصال اختياري (صورة حتى 2 ميغابايت)"
                    : "Optional receipt (image, up to 2 MB)"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                  />
                </label>
                <button disabled={busy} className={s.button}>
                  {busy
                    ? "…"
                    : ar
                      ? "إرسال للمراجعة"
                      : "Submit for verification"}
                </button>
                <p className={s.muted}>
                  {ar
                    ? "يُفعّل الوصول بعد التحقق من استلام الدفعة."
                    : "Reading access activates after we verify receipt of your payment."}
                </p>
              </form>
            ) : (
              <div>
                <h2>{ar ? "الخطوة التالية" : "What happens next"}</h2>
                <p className={s.muted}>{order.access
                  ? (ar ? "كتابك متاح الآن في مكتبتك. سنحفظ موضع القراءة لتتابع من حيث توقفت." : "Your book is now in your library. Your reading position is saved so you can return to the same page.")
                  : order.state === "UNDER_REVIEW"
                    ? (ar ? "يتحقق فريقنا من وصول الدفعة. سنراسلك على بريد الشراء عند تفعيل القراءة أو إذا احتجنا إلى معلومات إضافية." : "Our team will confirm the payment reached us. We’ll email you when reading access is ready, or if we need any more details.")
                    : (ar ? "راجع حالة الطلب وملاحظات الفريق، أو تواصل معنا للمساعدة." : "Review your order status and any notes from our team, or contact us for help.")}</p>
                <Link href={`/${locale}/ebooks/library`} className={s.secondary} style={{ marginTop: 20 }}>{ar ? "الذهاب إلى كتبي الإلكترونية" : "Go to My ebooks"}</Link>
              </div>
            )}
            {order.hasReceipt && (
              <a
                target="_blank"
                rel="noreferrer"
                className={s.secondary}
                href={`/api/ebooks/orders/${id}?receipt=1`}
              >
                {ar ? "عرض الإيصال" : "View receipt"}
              </a>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
