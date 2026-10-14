import s from "./loading.module.css";
import p from "./purchase.module.css";
import shared from "./ebooks.module.css";

function Lines() { return <><div className={`${s.block} ${s.title}`} /><div className={`${s.block} ${s.line}`} /><div className={`${s.block} ${s.short}`} /></>; }
export function LibrarySkeleton({ ar }: { ar: boolean }) {
  return <div role="status" aria-busy="true" className={s.library}>
    <p className={s.caption}>{ar ? "جارٍ تحميل كتبك وطلباتك…" : "Loading your ebooks and orders…"}</p>
    <div className={`${s.block} ${s.progress}`} aria-hidden="true" />
    <div className={shared.libraryGrid} aria-hidden="true">{[0, 1, 2].map(i => <div className={`${shared.libraryCard} ${s.stack}`} key={i}><div className={`${s.block} ${s.libraryCover}`} /><Lines /><div className={`${s.block} ${s.field}`} /></div>)}</div>
  </div>;
}
export function OrderFormSkeleton({ ar, payment = false }: { ar: boolean; payment?: boolean }) {
  return <div role="status" aria-busy="true" className={s.form}>
    <p className={s.caption}>{payment ? (ar ? "جارٍ تجهيز صفحة الدفع…" : "Preparing your payment page…") : (ar ? "جارٍ تجهيز طلبك…" : "Preparing your order…")}</p>
    <div aria-hidden="true" className={s.stack}><Lines /><div className={`${s.block} ${s.field}`} /><div className={`${s.block} ${s.field}`} /></div>
  </div>;
}
export function ProductSkeleton({ ar }: { ar: boolean }) {
  return <div role="status" aria-busy="true" aria-label={ar ? "جارٍ تحميل الكتاب" : "Loading ebook"}>
    <span className={s.srOnly}>{ar ? "جارٍ تحميل تفاصيل الكتاب…" : "Loading ebook details…"}</span>
    <div className={p.hero} aria-hidden="true"><div className={`${s.block} ${s.cover}`} /><div className={s.stack}><div className={`${s.block} ${s.short}`} /><Lines /><div className={`${s.block} ${s.paragraph}`} /><div className={`${s.block} ${s.field}`} /><div className={`${s.block} ${s.short}`} /><div className={`${s.block} ${s.field}`} /></div></div>
  </div>;
}
export function PaymentSkeleton({ ar }: { ar: boolean }) {
  return <div role="status" aria-busy="true" aria-label={ar ? "جارٍ تحميل تفاصيل الدفع" : "Loading payment details"}>
    <p className={s.caption}>{ar ? "جارٍ تحميل تفاصيل الدفع…" : "Loading your payment details…"}</p>
    <div aria-hidden="true"><div className={`${s.block} ${s.journey}`} /><div className={shared.split}>{[0, 1].map(i => <div key={i} className={`${shared.card} ${s.stack}`}><Lines /><div className={`${s.block} ${s.paragraph}`} /><div className={`${s.block} ${s.field}`} /><div className={`${s.block} ${s.field}`} /></div>)}</div></div>
  </div>;
}
export function EbookPageSkeleton({ ar, payment = false }: { ar: boolean; payment?: boolean }) {
  return <main className={payment ? shared.shell : p.page} dir={ar ? "rtl" : "ltr"}><div className={payment ? undefined : p.wrap}>
    <div className={s.nav} aria-hidden="true"><div className={`${s.block} ${s.short}`} /><div className={`${s.block} ${s.short}`} /></div>
    {payment ? <><div className={`${s.block} ${s.title}`} aria-hidden="true" /><PaymentSkeleton ar={ar} /></> : <ProductSkeleton ar={ar} />}
  </div></main>;
}
