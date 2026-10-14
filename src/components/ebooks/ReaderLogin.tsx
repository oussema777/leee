"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Mail } from "lucide-react";
import { ebookFetch } from "./client";
import s from "./ebooks.module.css";
import p from "./purchase.module.css";

export function ReaderLogin({ locale, onSuccess, checkout = false, library = false }: {
  locale: string;
  onSuccess: (email: string) => void;
  checkout?: boolean;
  library?: boolean;
}) {
  const ar = locale === "ar";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const codeInput = useRef<HTMLInputElement>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (sent) codeInput.current?.focus(); }, [sent]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function submit(action: "REQUEST" | "VERIFY") {
    setBusy(true); setError("");
    try {
      await ebookFetch("/api/ebooks/auth", { action, email, code, locale });
      if (!mounted.current) return;
      if (action === "REQUEST") { setSent(true); setCooldown(60); }
      else onSuccess(email.trim().toLowerCase());
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const Heading = library ? "h1" : checkout ? "h3" : "h2";
  return <section className={library ? `${s.librarySignIn} ${p.loginPanel}` : checkout ? p.loginPanel : `${s.card} ${s.narrow} ${p.loginPanel}`}>
    {library && <span className={s.signInIcon} aria-hidden="true"><BookOpen size={26} /></span>}
    {!checkout && <span className={s.eyebrow}>{library ? (ar ? "مساحة القراءة • LEE" : "LEE reading room") : (ar ? "مساحتك للقراءة" : "Your reading space")}</span>}
    <Heading>{sent ? (ar ? "تحقّق من بريدك" : "Check your inbox") : library ? (ar ? "افتح مكتبتك" : "Open your library") : checkout ? (ar ? "اربط كتابك ببريدك" : "Connect your ebook to your email") : (ar ? "الدخول بالبريد الإلكتروني" : "Sign in with your email")}</Heading>
    <p>{sent
      ? (ar ? "أدخل الرمز المكوّن من ٦ أرقام الذي أرسلناه إليك. صالح لعشر دقائق. تحقق من البريد غير المرغوب فيه أيضاً." : "Enter the 6-digit code we just sent you. It’s valid for 10 minutes. Check your spam folder too.")
      : checkout
        ? (ar ? "سيُحفظ الكتاب في مكتبتك بهذا البريد، وسنرسل إليه رابط القراءة بعد التحقق من الدفع. لا تحتاج إلى كلمة مرور." : "This email will hold your library and receive your reading link after payment approval. No password to create.")
        : (ar ? "استخدم البريد الذي طلبت به كتابك. سنرسل رمزاً للدخول إلى مكتبتك." : "Use the email you ordered with. We’ll send a code to open your library.")}</p>
    {error && <div role="alert" className={s.error}>{error}</div>}
    <form className={s.form} onSubmit={e => { e.preventDefault(); void submit(sent ? "VERIFY" : "REQUEST"); }}>
      <label>{ar ? "البريد الإلكتروني" : "Email"}
        <input data-autofocus type="email" autoComplete="email" dir="ltr" placeholder="you@example.com" value={email} required disabled={sent || busy} onChange={e => setEmail(e.target.value)} />
      </label>
      {sent && <label>{ar ? "رمز الدخول" : "Sign-in code"}
        <input ref={codeInput} inputMode="numeric" dir="ltr" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} disabled={busy} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ""))} required />
      </label>}
      <button className={p.primary} disabled={busy}>
        {busy ? (ar ? "لحظة…" : "Please wait…") : sent ? (checkout ? (ar ? "تأكيد ومتابعة" : "Verify & continue") : (ar ? "دخول" : "Sign in")) : (ar ? "إرسال رمز الدخول" : "Email me a code")}
        {sent ? <ArrowRight size={17} className="rtl:rotate-180" aria-hidden="true" /> : <Mail size={17} aria-hidden="true" />}
      </button>
      {sent && <div className={p.loginLinks}>
        <button type="button" className={p.textButton} disabled={busy || cooldown > 0} onClick={() => void submit("REQUEST")}>{cooldown ? (ar ? `إعادة الإرسال بعد ${cooldown} ثانية` : `Resend in ${cooldown}s`) : (ar ? "إعادة الإرسال" : "Resend code")}</button>
        <button type="button" className={p.textButton} disabled={busy} onClick={() => { setSent(false); setCode(""); setError(""); }}>{ar ? "تغيير البريد" : "Change email"}</button>
      </div>}
    </form>
    {library && !sent && <p className={s.signInHint}>{ar ? "لا تحتاج إلى كلمة مرور. كتبك وعلاماتك المرجعية مرتبطة ببريدك." : "No password needed. Your books and bookmarks are linked to your email."}</p>}
  </section>;
}
