"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { BookOpen, ChevronDown, ClipboardList, LogOut, UserRound } from "lucide-react";
import { ebookFetch } from "./client";
import s from "./account.module.css";

export function ReaderAccount({ email, locale, compact = false, onSignOut }: {
  email: string; locale: string; compact?: boolean; onSignOut: () => void;
}) {
  const ar = locale === "ar", id = useId();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const parts = email.split("@")[0].split(/[._+\-]+/).filter(Boolean);
  const initials = parts.slice(0, 2).map(part => Array.from(part)[0]).join("").toLocaleUpperCase();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  async function signOut() {
    setBusy(true); setError("");
    try { await ebookFetch("/api/ebooks/auth", {}, "DELETE"); setOpen(false); onSignOut(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <div ref={root} className={s.account} data-compact={compact} onBlur={e => {
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
  }} onKeyDown={e => {
    if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button ref={trigger} className={s.trigger} aria-label={ar ? "مساحتي — الحساب" : "My space — account"}
      aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      <span className={s.avatar} aria-hidden="true">{initials || <UserRound size={18} />}</span>
      {!compact && <><span>{ar ? "مساحتي" : "My space"}</span><ChevronDown size={14} aria-hidden="true" /></>}
    </button>
    {open && <div className={s.popover} id={id}>
      <div className={s.identity}><span>{ar ? "تم تسجيل الدخول باسم" : "Signed in as"}</span><strong dir="ltr">{email}</strong></div>
      <nav aria-label={ar ? "الحساب" : "Your account"}>
        <Link className={s.item} href={`/${locale}/ebooks/library`} onClick={() => setOpen(false)}><BookOpen size={17} />{ar ? "كتبي الإلكترونية" : "My ebooks"}</Link>
        <Link className={s.item} href={`/${locale}/ebooks/library#my-orders`} onClick={() => setOpen(false)}><ClipboardList size={17} />{ar ? "طلباتي" : "My orders"}</Link>
      </nav>
      <button className={s.item} disabled={busy} onClick={() => void signOut()}><LogOut size={17} />{busy ? (ar ? "جارٍ تسجيل الخروج…" : "Signing out…") : (ar ? "تسجيل الخروج" : "Sign out")}</button>
      {error && <p className={s.error} role="alert">{error}</p>}
    </div>}
  </div>;
}
