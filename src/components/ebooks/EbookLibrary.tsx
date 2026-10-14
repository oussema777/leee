"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ReaderLogin } from "./ReaderLogin";
import { ReaderAccount } from "./ReaderAccount";
import { EbookClientError, ebookFetch, money, stateLabel } from "./client";
import { LibrarySkeleton } from "./EbookSkeleton";
import s from "./ebooks.module.css";
type Library = {
  reader: { email: string };
  access: {
    id: string;
    preview?: boolean;
    ebook: {
      id: string;
      titleEn: string;
      titleAr: string;
      author: string;
      coverUrl: string;
    };
  }[];
  orders: {
    id: string;
    title: string;
    reference: string;
    state: string;
    priceCents: number;
  }[];
};
export function EbookLibrary({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const [auth, setAuth] = useState<boolean | null>(null);
  const [data, setData] = useState<Library | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const library = await ebookFetch<Library>("/api/ebooks/orders");
      setData(library);
      setAuth(true);
    } catch (e) {
      if (e instanceof EbookClientError && e.status === 401) { setAuth(false); setData(null); }
      else setError((e as Error).message);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (data && window.location.hash === "#my-orders") document.getElementById("my-orders")?.scrollIntoView();
  }, [data]);
  return (
    <main className={s.shell} dir={ar ? "rtl" : "ltr"}>
      {auth === true && <div className={s.top}>
        <Link href={`/${locale}/books?format=ebook`} className={s.secondary}>
          {ar ? "تصفح الكتب" : "Browse ebooks"}
        </Link>
        {auth && data?.reader && <ReaderAccount email={data.reader.email} locale={locale} onSignOut={() => { setAuth(false); setData(null); }} />}
      </div>}
      {auth === true && <><h1>{ar ? "كتبي الإلكترونية" : "My ebooks"}</h1>
      <p className={s.muted}>
        {ar
          ? "مساحتك للقراءة ومتابعة طلباتك."
          : "Your reading space and purchase updates."}
      </p></>}
      {error && (
        <p role="alert" className={s.error}>
          {error}{" "}
          <button onClick={() => void load()}>
            {ar ? "إعادة المحاولة" : "Retry"}
          </button>
        </p>
      )}
      {loading ? (
        <LibrarySkeleton ar={ar} />
      ) : auth === false ? (
        <div className={s.signInPage}>
          <ReaderLogin locale={locale} library onSuccess={() => void load()} />
          <Link href={`/${locale}/books?format=ebook`} className={s.signInBrowse}>{ar ? "اكتشف الكتب الإلكترونية ←" : "Explore ebooks →"}</Link>
        </div>
      ) : !data ? null : (
        <>
          <div className={s.libraryGrid}>
            {data.access.map((a) => (
              <article className={s.libraryCard} key={a.id}>
                <Link href={`/${locale}/ebooks/read/${a.ebook.id}`} className={s.bookJacket}
                  aria-label={`${ar ? "متابعة القراءة" : "Continue reading"}: ${ar ? a.ebook.titleAr || a.ebook.titleEn : a.ebook.titleEn}`}>
                {a.ebook.coverUrl ? <img src={a.ebook.coverUrl} className={s.libraryCover} alt="" /> : <div className={s.bookFallback}>{a.ebook.titleEn}</div>}
                <div className={s.bookReveal}>
                <span className={s.bookFormat}>{ar ? "كتاب إلكتروني" : "Ebook"}</span>
                <h2>
                  {ar ? a.ebook.titleAr || a.ebook.titleEn : a.ebook.titleEn}
                </h2>
                <p className={s.bookAuthor}>{a.ebook.author}</p>
                <span className={s.bookAction}>{ar ? "متابعة القراءة" : "Continue reading"}<span aria-hidden="true">{ar ? "←" : "→"}</span></span>
                {a.preview && <p className={s.previewNote}>{ar ? "وصول تجريبي مؤقت — لم يتم تأكيد الدفع." : "Temporary preview · Payment not verified"}</p>}
                </div>
                </Link>
              </article>
            ))}
          </div>
          {!data.access.length && (
            <p className={s.notice}>
              {ar
                ? "ستظهر كتبك هنا بعد التحقق من الدفع."
                : "Your ebooks will appear here once payment has been verified."}
            </p>
          )}
          <h2 id="my-orders" style={{ marginTop: 48, scrollMarginTop: 130 }}>{ar ? "طلباتي" : "My orders"}</h2>
          <div className={s.list}>
            {data.orders.map((o) => (
              <div className={s.listItem} key={o.id}>
                <div>
                  <strong>{o.title}</strong>
                  <p className={s.muted}>
                    {o.reference} · {money(o.priceCents)}
                  </p>
                  <span className={s.badge}>{stateLabel(o.state, ar)}</span>
                </div>
                <Link
                  href={`/${locale}/ebooks/orders/${o.id}`}
                  className={s.secondary}
                >
                  {ar ? "تفاصيل الطلب" : "View order"}
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
