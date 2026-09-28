"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { GOVERNORATES } from "@/lib/book-restore/validation";
import { BOOK_VOLUNTEER_INTERESTS, type BookVolunteerInput } from "@/lib/book-restore/volunteer";

const interests = {
  COLLECTION: ["Book collection and pickup", "جمع الكتب واستلامها"],
  ORDER_PREPARATION: ["Sorting and preparing orders", "فرز الكتب وتجهيز الطلبات"],
  STREET_INTERVIEWS: ["Street interviews", "المقابلات في الشارع"],
  VIDEO_CONTENT: ["Video and content creation", "تصوير الفيديو وصناعة المحتوى"],
  COMMUNITY_OUTREACH: ["Community outreach", "التواصل المجتمعي"],
  OTHER: ["Something else", "مساعدة أخرى"],
} as const;
const governorates: Record<string, [string, string]> = {
  AKKAR: ["Akkar", "عكار"], NORTH_LEBANON: ["North Lebanon", "الشمال"], SOUTH_LEBANON: ["South Lebanon", "الجنوب"],
  BEIRUT: ["Beirut", "بيروت"], MOUNT_LEBANON: ["Mount Lebanon", "جبل لبنان"], NABATIEH: ["Nabatieh", "النبطية"],
  BEKAA: ["Bekaa", "البقاع"], BAALBEK_HERMEL: ["Baalbek-Hermel", "بعلبك الهرمل"],
};
const copy = {
  en: {
    title: "Volunteer for Book Restore", intro: "Tell us how you would like to help. Our team will contact you about suitable tasks and next steps.",
    name: "Full name", phone: "Phone / WhatsApp", email: "Email (optional)", governorate: "Governorate", area: "Area or town", select: "Choose a governorate",
    interest: "How would you like to help?", interestHint: "Choose one or more activities.", other: "Tell us about the other activity",
    availability: "When are you usually available?", weekdays: "Weekdays", weekends: "Weekends", flexible: "Flexible / let's discuss",
    experience: "Relevant experience (optional)", experienceHint: "Experience is welcome, but not required.", notes: "Anything else we should know? (optional)",
    consent: "I agree that LEE may use these details to contact me about Book Restore volunteering. Sending this form does not commit me to a role or grant permission to use my image in videos.",
    submit: "Send volunteer application", sending: "Sending…", success: "Thank you for offering to help", successBody: "Your application has reached our team. We will contact you about the next step.", reference: "Application reference", another: "Send another application",
    error: "We could not send your application. Please try again.", rate: "Too many attempts from this connection. Please try again later.", validation: "Please check the highlighted details.",
  },
  ar: {
    title: "تطوّع مع مشروع إحياء الكتب", intro: "أخبرنا كيف ترغب بالمساعدة. سيتواصل معك فريقنا بشأن المهام المناسبة والخطوات التالية.",
    name: "الاسم الكامل", phone: "الهاتف / واتساب", email: "البريد الإلكتروني (اختياري)", governorate: "المحافظة", area: "المنطقة أو البلدة", select: "اختر المحافظة",
    interest: "كيف ترغب بالمساعدة؟", interestHint: "يمكنك اختيار أكثر من نشاط.", other: "أخبرنا عن نوع المساعدة الأخرى",
    availability: "متى تكون متاحاً عادةً؟", weekdays: "أيام الأسبوع", weekends: "نهاية الأسبوع", flexible: "مرن / ننسّق معاً",
    experience: "خبرة ذات صلة (اختياري)", experienceHint: "الخبرة مفيدة لكنها ليست مطلوبة.", notes: "هل هناك ما تود إضافته؟ (اختياري)",
    consent: "أوافق على استخدام LEE لهذه المعلومات للتواصل معي بشأن التطوع في مشروع إحياء الكتب. لا يلزمني إرسال النموذج بدور معين ولا يمنح إذناً باستخدام صورتي في الفيديوهات.",
    submit: "أرسل طلب التطوع", sending: "جارٍ الإرسال…", success: "شكراً لرغبتك في المساعدة", successBody: "وصل طلبك إلى فريقنا. سنتواصل معك بشأن الخطوة التالية.", reference: "مرجع الطلب", another: "إرسال طلب آخر",
    error: "تعذّر إرسال طلبك. حاول مجدداً.", rate: "تم إرسال طلبات كثيرة من هذا الاتصال. يرجى المحاولة لاحقاً.", validation: "يرجى مراجعة المعلومات المطلوبة.",
  },
} as const;
const field = "mt-2 w-full rounded-xl border border-surface-tertiary bg-white px-4 py-3 text-text-primary outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20";

export function BookVolunteerForm({ locale }: { locale: "en" | "ar" }) {
  const t = copy[locale]; const ar = locale === "ar";
  const [selected, setSelected] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reference, setReference] = useState<string | null>(null);
  function toggle(value: string) { setSelected(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]); setFieldErrors(current => ({ ...current, interests: "" })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting) return;
    const form = new FormData(event.currentTarget);
    if (!selected.length || !consent) { setError(t.validation); setFieldErrors({ interests: !selected.length ? t.interestHint : "", privacyConsent: !consent ? t.validation : "" }); return; }
    const payload: BookVolunteerInput = {
      fullName: String(form.get("fullName") || ""), phone: String(form.get("phone") || ""), email: String(form.get("email") || ""),
      governorate: String(form.get("governorate") || "") as BookVolunteerInput["governorate"], area: String(form.get("area") || ""),
      interests: selected as BookVolunteerInput["interests"], otherInterest: String(form.get("otherInterest") || ""),
      availability: String(form.get("availability") || "") as BookVolunteerInput["availability"],
      experience: String(form.get("experience") || ""), notes: String(form.get("notes") || ""),
      locale, privacyConsent: true, website: String(form.get("website") || ""),
    };
    setSubmitting(true); setError(""); setFieldErrors({});
    try {
      const response = await fetch("/api/public/book-restore/volunteers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) {
        if (result.fields) setFieldErrors(result.fields);
        throw Error(result.error === "rate_limited" ? t.rate : result.error === "validation" ? t.validation : t.error);
      }
      setReference(result.reference || "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.error); }
    finally { setSubmitting(false); }
  }
  if (reference !== null) return <div role="status" className="rounded-3xl bg-white p-8 text-center shadow-sm md:p-12">
    <CheckCircle2 className="mx-auto size-14 text-emerald-600" aria-hidden="true" /><h2 className="mt-5 font-serif text-3xl text-accent-navy">{t.success}</h2>
    <p className="mt-3 text-text-secondary">{t.successBody}</p>{reference && <p className="mt-5 font-semibold text-accent-navy">{t.reference}: <bdi>{reference}</bdi></p>}
    <button type="button" onClick={() => { setReference(null); setSelected([]); setConsent(false); }} className="mt-7 rounded-xl border border-brand-blue px-5 py-3 font-semibold text-brand-blue-deeper">{t.another}</button>
  </div>;
  return <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-[0_18px_45px_-28px_rgba(27,58,92,0.45)] md:p-9">
    <h2 className="font-serif text-3xl text-accent-navy">{t.title}</h2><p className="mt-3 leading-7 text-text-secondary">{t.intro}</p>
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-semibold text-accent-navy">{t.name} <span className="text-red-600">*</span><input name="fullName" required minLength={2} maxLength={120} autoComplete="name" className={field} aria-invalid={!!fieldErrors.fullName} />{fieldErrors.fullName && <span className="mt-1 block text-xs text-red-600">{fieldErrors.fullName}</span>}</label>
      <label className="text-sm font-semibold text-accent-navy">{t.phone} <span className="text-red-600">*</span><input name="phone" type="tel" required minLength={6} maxLength={30} autoComplete="tel" dir="ltr" className={field} aria-invalid={!!fieldErrors.phone} />{fieldErrors.phone && <span className="mt-1 block text-xs text-red-600">{fieldErrors.phone}</span>}</label>
      <label className="text-sm font-semibold text-accent-navy">{t.email}<input name="email" type="email" maxLength={200} autoComplete="email" dir="ltr" className={field} aria-invalid={!!fieldErrors.email} />{fieldErrors.email && <span className="mt-1 block text-xs text-red-600">{fieldErrors.email}</span>}</label>
      <label className="text-sm font-semibold text-accent-navy">{t.governorate} <span className="text-red-600">*</span><select name="governorate" required defaultValue="" className={field} aria-invalid={!!fieldErrors.governorate}><option value="" disabled>{t.select}</option>{GOVERNORATES.map(value => <option key={value} value={value}>{governorates[value]?.[ar ? 1 : 0] || value}</option>)}</select></label>
      <label className="text-sm font-semibold text-accent-navy sm:col-span-2">{t.area} <span className="text-red-600">*</span><input name="area" required minLength={2} maxLength={120} autoComplete="address-level2" className={field} aria-invalid={!!fieldErrors.area} /></label>
    </div>
    <fieldset className="mt-8"><legend className="text-base font-semibold text-accent-navy">{t.interest} <span className="text-red-600">*</span></legend><p className="mt-1 text-sm text-text-secondary">{t.interestHint}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{BOOK_VOLUNTEER_INTERESTS.map(value => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${selected.includes(value) ? "border-brand-blue bg-accent-ice text-accent-navy" : "border-surface-tertiary text-text-secondary"}`}><input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value)} className="size-4 accent-brand-blue" />{interests[value][ar ? 1 : 0]}</label>)}</div>
      {fieldErrors.interests && <p className="mt-2 text-sm text-red-600">{fieldErrors.interests}</p>}
      {selected.includes("OTHER") && <label className="mt-4 block text-sm font-semibold text-accent-navy">{t.other} <span className="text-red-600">*</span><input name="otherInterest" required maxLength={120} className={field} aria-invalid={!!fieldErrors.otherInterest} /></label>}
    </fieldset>
    <div className="mt-8 space-y-5">
      <fieldset><legend className="text-base font-semibold text-accent-navy">{t.availability} <span className="text-red-600">*</span></legend><div className="mt-3 flex flex-wrap gap-3">{(["WEEKDAYS", "WEEKENDS", "FLEXIBLE"] as const).map(value => <label key={value} className="inline-flex items-center gap-2 rounded-xl border border-surface-tertiary px-4 py-3 text-sm text-accent-navy"><input type="radio" name="availability" value={value} required className="accent-brand-blue" />{value === "WEEKDAYS" ? t.weekdays : value === "WEEKENDS" ? t.weekends : t.flexible}</label>)}</div></fieldset>
      <label className="block text-sm font-semibold text-accent-navy">{t.experience}<span className="mt-1 block text-xs font-normal text-text-secondary">{t.experienceHint}</span><textarea name="experience" rows={3} maxLength={1000} className={field} /></label>
      <label className="block text-sm font-semibold text-accent-navy">{t.notes}<textarea name="notes" rows={3} maxLength={1000} className={field} /></label>
    </div>
    <label className="mt-7 flex items-start gap-3 rounded-xl bg-accent-ice p-4 text-sm leading-6 text-accent-navy"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-brand-blue" />{t.consent} <span className="font-bold text-red-600">*</span></label>
    <div aria-hidden="true" className="absolute -left-[9999px]"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <button type="submit" disabled={submitting} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-accent-navy px-6 py-3 font-semibold text-white transition hover:bg-brand-blue-deeper disabled:opacity-60">{submitting && <Loader2 className="size-4 animate-spin" />}{submitting ? t.sending : t.submit}</button>
  </form>;
}
