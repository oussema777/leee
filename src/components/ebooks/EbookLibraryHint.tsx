"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Library, X } from "lucide-react";
import p from "./purchase.module.css";

const SEEN_KEY = "ebook-library-introduction-v2";
const READING_TIME = 9000;

export function EbookLibraryHint({ locale, ready, coverUrl }: { locale: string; ready: boolean; coverUrl: string }) {
  const ar = locale === "ar";
  const id = useId();
  const link = useRef<HTMLAnchorElement>(null);
  const remaining = useRef(READING_TIME);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;

  function dismiss(restoreFocus = false) {
    if (restoreFocus) link.current?.focus();
    setLeaving(true);
  }

  useEffect(() => {
    if (!ready) { setVisible(false); return; }
    try { if (sessionStorage.getItem(SEEN_KEY)) return; } catch { /* Storage is optional. */ }
    const reveal = window.setTimeout(() => {
      remaining.current = READING_TIME;
      setLeaving(false);
      setVisible(true);
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* Still show the hint without storage. */ }
    }, 1200);
    return () => window.clearTimeout(reveal);
  }, [ready]);

  useEffect(() => {
    if (!visible || paused || leaving) return;
    const start = performance.now();
    const timer = window.setTimeout(() => setLeaving(true), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - start));
    };
  }, [visible, paused, leaving]);

  useEffect(() => {
    if (!visible || !leaving) return;
    const timer = window.setTimeout(() => setVisible(false), 260);
    return () => window.clearTimeout(timer);
  }, [visible, leaving]);

  useEffect(() => {
    if (!visible) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (document.activeElement?.closest("[data-library-introduction]")) link.current?.focus();
        setLeaving(true);
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [visible]);

  return <div className={p.libraryShortcut} data-highlighted={visible && !leaving || undefined}>
    <Link ref={link} href={`/${locale}/ebooks/library`} className={p.libraryLink}
      aria-describedby={visible ? id : undefined} onClick={() => dismiss()}>
      <Library size={16} aria-hidden="true" />{ar ? "كتبي الإلكترونية" : "My ebooks"}
    </Link>
    {visible && <aside className={p.libraryHint} data-library-introduction data-leaving={leaving || undefined}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      aria-label={ar ? "دليلك إلى مكتبتك" : "A guide to your library"}>
      <div className={p.hintHeader}>
        <span><BookOpen size={13} aria-hidden="true" />{ar ? "مساحتك للقراءة" : "YOUR READING SPACE"}</span>
        <button type="button" className={p.hintClose} onClick={() => dismiss(true)} aria-label={ar ? "إغلاق التلميح" : "Dismiss hint"}><X size={15} aria-hidden="true" /></button>
      </div>
      <div className={p.hintBody}>
        {coverUrl && <div className={p.hintBook} aria-hidden="true"><img src={coverUrl} alt="" draggable={false} /></div>}
        <div id={id} role="status">
          <strong>{ar ? "من هنا، تبدأ قراءتك." : "Your next chapter starts here."}</strong>
          <p>{ar ? "بعد تأكيد الدفع، ستجد كتبك هنا. ادخل ببريد الشراء وتابع من حيث توقفت." : "After payment approval, your books live here. Sign in with your purchase email and pick up where you left off."}</p>
        </div>
      </div>
      <div className={p.hintFooter}>
        <span>{ar ? "مكتبتك، أينما كنت" : "Your library, wherever you are"}</span>
        <Link href={`/${locale}/ebooks/library`} onClick={() => dismiss()}>{ar ? "اكتشفها" : "Take a look"}<ArrowUpRight size={14} className="rtl:-scale-x-100" aria-hidden="true" /></Link>
      </div>
      <span className={p.hintProgress} style={{ animationPlayState: paused || leaving ? "paused" : "running" }} aria-hidden="true" />
    </aside>}
  </div>;
}
