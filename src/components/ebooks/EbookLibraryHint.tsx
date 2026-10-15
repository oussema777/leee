"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Library, X } from "lucide-react";
import p from "./purchase.module.css";

const SEEN_KEY = "ebook-library-hint-v1";

export function EbookLibraryHint({ locale, ready }: { locale: string; ready: boolean }) {
  const ar = locale === "ar";
  const id = useId();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready) { setVisible(false); return; }
    try { if (sessionStorage.getItem(SEEN_KEY)) return; } catch { /* Storage is optional. */ }
    const reveal = window.setTimeout(() => {
      setVisible(true);
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* Still show the hint without storage. */ }
    }, 900);
    const dismiss = window.setTimeout(() => setVisible(false), 7900);
    return () => { window.clearTimeout(reveal); window.clearTimeout(dismiss); };
  }, [ready]);

  useEffect(() => {
    if (!visible) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [visible]);

  return <div className={p.libraryShortcut}>
    <Link href={`/${locale}/ebooks/library`} className={`${p.libraryLink} ${visible ? p.libraryNudge : ""}`}
      aria-describedby={visible ? id : undefined} onClick={() => setVisible(false)}>
      <Library size={16} aria-hidden="true" />{ar ? "كتبي الإلكترونية" : "My ebooks"}
    </Link>
    {visible && <div className={p.libraryHint}>
      <div id={id} role="status">
        <strong>{ar ? "هنا مكتبتك للقراءة" : "Your reading shelf"}</strong>
        <p>{ar ? "ستجد كتبك المشتراة هنا. سجّل الدخول ببريد الشراء." : "Find your purchased ebooks here. Sign in with your purchase email."}</p>
      </div>
      <button type="button" className={p.hintClose} onClick={() => setVisible(false)} aria-label={ar ? "إغلاق التلميح" : "Dismiss hint"}><X size={14} aria-hidden="true" /></button>
    </div>}
  </div>;
}
