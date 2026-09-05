"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BOOK_CATEGORIES,
  BOOK_CONDITIONS,
  BOOK_LANGUAGES,
  GOVERNORATES,
  HANDOVER_METHODS,
  QUANTITY_RANGES,
} from "@/lib/book-restore/validation";

type Locale = "en" | "ar";
type FormState = {
  fullName: string;
  phone: string;
  email: string;
  governorate: string;
  area: string;
  detailedAddress: string;
  estimatedQuantity: string;
  bookCategories: string[];
  otherCategory: string;
  bookLanguages: string[];
  overallCondition: string;
  handoverMethod: string;
  notes: string;
  donationConsent: boolean;
  privacyConsent: boolean;
  acceptanceAcknowledged: boolean;
  website: string;
};

const initialForm: FormState = {
  fullName: "",
  phone: "",
  email: "",
  governorate: "",
  area: "",
  detailedAddress: "",
  estimatedQuantity: "",
  bookCategories: [],
  otherCategory: "",
  bookLanguages: [],
  overallCondition: "",
  handoverMethod: "",
  notes: "",
  donationConsent: false,
  privacyConsent: false,
  acceptanceAcknowledged: false,
  website: "",
};

const labels = {
  governorates: {
    AKKAR: ["Akkar", "عكار"], NORTH_LEBANON: ["North Lebanon", "الشمال"], SOUTH_LEBANON: ["South Lebanon", "الجنوب"],
    BEIRUT: ["Beirut", "بيروت"], MOUNT_LEBANON: ["Mount Lebanon", "جبل لبنان"], NABATIEH: ["Nabatieh", "النبطية"],
    BEKAA: ["Bekaa", "البقاع"], BAALBEK_HERMEL: ["Baalbek-Hermel", "بعلبك الهرمل"],
  },
  quantities: {
    UNDER_10: ["Fewer than 10", "أقل من 10"], FROM_10_TO_25: ["10–25 books", "10–25 كتاباً"],
    FROM_26_TO_50: ["26–50 books", "26–50 كتاباً"], FROM_51_TO_100: ["51–100 books", "51–100 كتاب"],
    OVER_100: ["More than 100", "أكثر من 100"],
  },
  categories: {
    FICTION: ["Fiction", "روايات وقصص"], CHILDREN: ["Children", "أطفال"], EDUCATIONAL: ["School & educational", "مدرسية وتعليمية"],
    UNIVERSITY: ["University", "جامعية"], BUSINESS: ["Business", "أعمال"], SELF_DEVELOPMENT: ["Self-development", "تطوير ذاتي"], OTHER: ["Other", "أخرى"],
  },
  languages: { ARABIC: ["Arabic", "العربية"], ENGLISH: ["English", "الإنجليزية"], FRENCH: ["French", "الفرنسية"], OTHER: ["Other", "أخرى"] },
  conditions: { EXCELLENT: ["Excellent", "ممتازة"], GOOD: ["Good", "جيدة"], ACCEPTABLE: ["Acceptable", "مقبولة"], MIXED: ["Mixed", "متنوعة"] },
  handover: { DROP_OFF: ["I can drop them off", "يمكنني تسليمها"], PICKUP: ["I need pickup", "أحتاج إلى الاستلام من موقعي"] },
} as const;

const copy = {
  en: {
    formTitle: "Register a book donation", formIntro: "Estimates are fine. Required fields are marked with an asterisk.",
    steps: ["Your details", "The books", "Handover"], step: "Step", of: "of",
    fullName: "Full name", phone: "Phone / WhatsApp", email: "Email", optional: "Optional", governorate: "Governorate",
    area: "Area or locality", address: "Detailed pickup address", addressHint: "Required only when pickup is selected.",
    quantity: "Estimated quantity", categories: "Book categories", categoryHint: "Select all that apply.", otherCategory: "Other category",
    languages: "Book languages", languageHint: "Optional — select all that apply.", condition: "Overall condition",
    handover: "Preferred handover", notes: "Notes for the team", notesHint: "Access details, preferred contact time, or anything else we should know.",
    donationConsent: "I confirm that I am donating these books free of charge and have the right to give them.",
    privacyConsent: "I agree that LEE may use these details to review and coordinate this donation.",
    acceptance: "I understand that submitting this form does not guarantee that every book will be accepted.",
    acceptanceAcknowledged: "I understand that submitting this form does not guarantee that every book will be accepted.",
    routing: "Books are reviewed and may be routed for resale, community use, or responsible recycling under the approved policy.",
    next: "Continue", back: "Back", submit: "Register donation", submitting: "Registering…",
    required: "Please complete this field.", invalidEmail: "Enter a valid email address or leave it blank.", chooseOne: "Select at least one option.",
    addressRequired: "Add the address where the books should be collected.", otherRequired: "Describe the other category.", consentRequired: "Please confirm this acknowledgement.",
    server: "We could not register the donation. Please try again.", rate: "Too many attempts were made from this connection. Please try again later.",
    validation: "Please review the highlighted fields.", successTitle: "Your donation is registered", successBody: "Keep this reference. Our team will review your details and contact you to confirm the next step.", reference: "Donation reference", another: "Register another donation",
  },
  ar: {
    formTitle: "سجّل تبرعاً بالكتب", formIntro: "المعلومات التقديرية كافية. الحقول المطلوبة مميزة بنجمة.",
    steps: ["بياناتك", "الكتب", "التسليم"], step: "الخطوة", of: "من",
    fullName: "الاسم الكامل", phone: "الهاتف / واتساب", email: "البريد الإلكتروني", optional: "اختياري", governorate: "المحافظة",
    area: "المنطقة أو البلدة", address: "عنوان الاستلام بالتفصيل", addressHint: "مطلوب فقط عند اختيار الاستلام من موقعك.",
    quantity: "العدد التقريبي", categories: "فئات الكتب", categoryHint: "اختر كل ما ينطبق.", otherCategory: "الفئة الأخرى",
    languages: "لغات الكتب", languageHint: "اختياري — اختر كل ما ينطبق.", condition: "الحالة العامة",
    handover: "طريقة التسليم المفضلة", notes: "ملاحظات للفريق", notesHint: "تفاصيل الوصول أو وقت الاتصال المناسب أو أي معلومة مفيدة.",
    donationConsent: "أؤكد أنني أتبرع بهذه الكتب مجاناً وأن لدي الحق في تقديمها.",
    privacyConsent: "أوافق على استخدام LEE لهذه البيانات لمراجعة التبرع والتنسيق بشأنه.",
    acceptance: "أفهم أن إرسال الطلب لا يضمن قبول جميع الكتب.",
    acceptanceAcknowledged: "أفهم أن إرسال الطلب لا يضمن قبول جميع الكتب.",
    routing: "تُراجع الكتب وقد تُوجّه لإعادة البيع أو الاستخدام المجتمعي أو التدوير المسؤول وفق السياسة المعتمدة.",
    next: "متابعة", back: "السابق", submit: "تسجيل التبرع", submitting: "جارٍ التسجيل…",
    required: "يرجى إكمال هذا الحقل.", invalidEmail: "أدخل بريداً إلكترونياً صحيحاً أو اترك الحقل فارغاً.", chooseOne: "اختر خياراً واحداً على الأقل.",
    addressRequired: "أضف العنوان الذي يجب استلام الكتب منه.", otherRequired: "صِف الفئة الأخرى.", consentRequired: "يرجى تأكيد هذا الإقرار.",
    server: "تعذّر تسجيل التبرع. يرجى المحاولة مجدداً.", rate: "تم إرسال محاولات كثيرة من هذا الاتصال. يرجى المحاولة لاحقاً.",
    validation: "يرجى مراجعة الحقول المميزة.", successTitle: "تم تسجيل تبرعك", successBody: "احتفظ بهذا المرجع. سيراجع الفريق المعلومات ويتواصل معك لتأكيد الخطوة التالية.", reference: "مرجع التبرع", another: "تسجيل تبرع آخر",
  },
} as const;

const inputClass = "mt-2 w-full rounded-sm border border-surface-tertiary bg-white px-3.5 py-3 text-text-primary outline-none transition-colors placeholder:text-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100";

export function BookDonationForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const labelIndex = locale === "ar" ? 1 : 0;
  const [form, setForm] = useState<FormState>(initialForm);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const toggle = (field: "bookCategories" | "bookLanguages", value: string) => {
    const values = form[field];
    update(field, values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const focusFirstError = (nextErrors: Record<string, string>) => {
    const first = Object.keys(nextErrors)[0];
    if (first) requestAnimationFrame(() => document.getElementById(first)?.focus());
  };

  const validateStep = (currentStep: number) => {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 0) {
      if (form.fullName.trim().length < 2) nextErrors.fullName = t.required;
      if (form.phone.trim().length < 6) nextErrors.phone = t.required;
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = t.invalidEmail;
      if (!form.governorate) nextErrors.governorate = t.required;
      if (form.area.trim().length < 2) nextErrors.area = t.required;
    }
    if (currentStep === 1) {
      if (!form.estimatedQuantity) nextErrors.estimatedQuantity = t.required;
      if (!form.bookCategories.length) nextErrors.bookCategories = t.chooseOne;
      if (form.bookCategories.includes("OTHER") && !form.otherCategory.trim()) nextErrors.otherCategory = t.otherRequired;
      if (!form.overallCondition) nextErrors.overallCondition = t.required;
    }
    if (currentStep === 2) {
      if (!form.handoverMethod) nextErrors.handoverMethod = t.required;
      if (form.handoverMethod === "PICKUP" && !form.detailedAddress.trim()) nextErrors.detailedAddress = t.addressRequired;
      for (const key of ["donationConsent", "privacyConsent", "acceptanceAcknowledged"] as const) {
        if (!form[key]) nextErrors[key] = t.consentRequired;
      }
    }
    setErrors(nextErrors);
    focusFirstError(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    setRequestError("");
    if (validateStep(step)) {
      setStep((current) => Math.min(2, current + 1));
      document.getElementById("donation-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequestError("");
    if (!validateStep(2)) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/public/book-restore/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.error === "validation") {
          const fieldErrors = Object.fromEntries(Object.keys(result.fields ?? {}).map((key) => [key, t.required]));
          setErrors(fieldErrors);
          const firstField = Object.keys(fieldErrors)[0];
          if (["fullName", "phone", "email", "governorate", "area"].includes(firstField)) setStep(0);
          else if (["estimatedQuantity", "bookCategories", "otherCategory", "bookLanguages", "overallCondition"].includes(firstField)) setStep(1);
          focusFirstError(fieldErrors);
          throw new Error(t.validation);
        }
        throw new Error(result.error === "rate_limited" ? t.rate : t.server);
      }
      if (typeof result.reference !== "string") throw new Error(t.server);
      setReference(result.reference);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : t.server);
    } finally {
      setSubmitting(false);
    }
  };

  if (reference) {
    return (
      <div className="py-8 text-center" aria-live="polite">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <h2 className="mt-6 font-serif text-3xl text-accent-navy">{t.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-text-secondary">{t.successBody}</p>
        <div className="mx-auto mt-7 max-w-sm rounded-xl bg-brand-blue-light px-5 py-4">
          <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-accent-steel">{t.reference}</span>
          <strong className="mt-1 block text-xl tabular-nums tracking-[0.04em] text-accent-navy" dir="ltr">{reference}</strong>
        </div>
        <button type="button" onClick={() => { setForm(initialForm); setStep(0); setReference(null); }} className="mt-7 text-sm font-semibold text-brand-blue underline decoration-brand-blue/35 underline-offset-4 hover:text-brand-blue-dark">
          {t.another}
        </button>
      </div>
    );
  }

  const errorText = (field: string) => errors[field] ? <p id={`${field}-error`} className="mt-1.5 text-sm text-red-600">{errors[field]}</p> : null;
  const describedBy = (field: string, hint?: boolean) => [hint ? `${field}-hint` : "", errors[field] ? `${field}-error` : ""].filter(Boolean).join(" ") || undefined;
  const optionLabel = (group: keyof typeof labels, value: string) => (labels[group] as Record<string, readonly [string, string]>)[value][labelIndex];

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-3xl text-accent-navy tracking-[-0.02em]">{t.formTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{t.formIntro}</p>
      </div>

      <div className="mb-9" aria-label={`${t.step} ${step + 1} ${t.of} 3`}>
        <div className="mb-3 flex items-center justify-between text-xs font-semibold text-text-secondary">
          <span>{t.steps[step]}</span><span>{t.step} {step + 1} {t.of} 3</span>
        </div>
        <ol className="grid grid-cols-3 gap-2">
          {t.steps.map((name, index) => (
            <li key={name} className="flex items-center gap-2">
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", index < step ? "bg-emerald-600 text-white" : index === step ? "bg-accent-navy text-white" : "bg-surface-secondary text-text-secondary")}>
                {index < step ? <Check className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn("hidden text-xs sm:block", index === step ? "font-semibold text-accent-navy" : "text-text-secondary")}>{name}</span>
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} />
        </div>

        {step === 0 && (
          <fieldset className="space-y-5">
            <legend className="sr-only">{t.steps[0]}</legend>
            <div><label htmlFor="fullName" className="text-sm font-semibold text-text-primary">{t.fullName} <span className="text-red-600">*</span></label><input id="fullName" className={inputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} autoComplete="name" aria-invalid={!!errors.fullName} aria-describedby={describedBy("fullName")} />{errorText("fullName")}</div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="phone" className="text-sm font-semibold text-text-primary">{t.phone} <span className="text-red-600">*</span></label><input id="phone" type="tel" className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" dir="ltr" aria-invalid={!!errors.phone} aria-describedby={describedBy("phone")} />{errorText("phone")}</div>
              <div><label htmlFor="email" className="text-sm font-semibold text-text-primary">{t.email} <span className="font-normal text-text-secondary">({t.optional})</span></label><input id="email" type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" dir="ltr" aria-invalid={!!errors.email} aria-describedby={describedBy("email")} />{errorText("email")}</div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="governorate" className="text-sm font-semibold text-text-primary">{t.governorate} <span className="text-red-600">*</span></label><select id="governorate" className={inputClass} value={form.governorate} onChange={(e) => update("governorate", e.target.value)} aria-invalid={!!errors.governorate} aria-describedby={describedBy("governorate")}><option value="">—</option>{GOVERNORATES.map((value) => <option key={value} value={value}>{optionLabel("governorates", value)}</option>)}</select>{errorText("governorate")}</div>
              <div><label htmlFor="area" className="text-sm font-semibold text-text-primary">{t.area} <span className="text-red-600">*</span></label><input id="area" className={inputClass} value={form.area} onChange={(e) => update("area", e.target.value)} autoComplete="address-level2" aria-invalid={!!errors.area} aria-describedby={describedBy("area")} />{errorText("area")}</div>
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <div className="space-y-7">
            <div><label htmlFor="estimatedQuantity" className="text-sm font-semibold text-text-primary">{t.quantity} <span className="text-red-600">*</span></label><select id="estimatedQuantity" className={inputClass} value={form.estimatedQuantity} onChange={(e) => update("estimatedQuantity", e.target.value)} aria-invalid={!!errors.estimatedQuantity} aria-describedby={describedBy("estimatedQuantity")}><option value="">—</option>{QUANTITY_RANGES.map((value) => <option key={value} value={value}>{optionLabel("quantities", value)}</option>)}</select>{errorText("estimatedQuantity")}</div>
            <fieldset><legend className="text-sm font-semibold text-text-primary">{t.categories} <span className="text-red-600">*</span></legend><p id="bookCategories-hint" className="mt-1 text-sm text-text-secondary">{t.categoryHint}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{BOOK_CATEGORIES.map((value) => <label key={value} className={cn("flex cursor-pointer items-center gap-3 rounded-sm border px-3.5 py-3 text-sm transition-colors", form.bookCategories.includes(value) ? "border-brand-blue bg-brand-blue-light text-accent-navy" : "border-surface-tertiary hover:border-brand-blue/60")}><input id={value === BOOK_CATEGORIES[0] ? "bookCategories" : undefined} type="checkbox" checked={form.bookCategories.includes(value)} onChange={() => toggle("bookCategories", value)} className="size-4 accent-[#5895D0]" aria-invalid={!!errors.bookCategories} aria-describedby={describedBy("bookCategories", true)} />{optionLabel("categories", value)}</label>)}</div>{errorText("bookCategories")}</fieldset>
            {form.bookCategories.includes("OTHER") && <div><label htmlFor="otherCategory" className="text-sm font-semibold text-text-primary">{t.otherCategory} <span className="text-red-600">*</span></label><input id="otherCategory" className={inputClass} value={form.otherCategory} onChange={(e) => update("otherCategory", e.target.value)} aria-invalid={!!errors.otherCategory} aria-describedby={describedBy("otherCategory")} />{errorText("otherCategory")}</div>}
            <fieldset><legend className="text-sm font-semibold text-text-primary">{t.languages}</legend><p className="mt-1 text-sm text-text-secondary">{t.languageHint}</p><div className="mt-3 flex flex-wrap gap-2">{BOOK_LANGUAGES.map((value) => <label key={value} className={cn("cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors", form.bookLanguages.includes(value) ? "border-accent-navy bg-accent-navy text-white" : "border-surface-tertiary hover:border-brand-blue")}><input type="checkbox" checked={form.bookLanguages.includes(value)} onChange={() => toggle("bookLanguages", value)} className="sr-only" />{optionLabel("languages", value)}</label>)}</div></fieldset>
            <fieldset><legend className="text-sm font-semibold text-text-primary">{t.condition} <span className="text-red-600">*</span></legend><div className="mt-3 grid grid-cols-2 gap-2">{BOOK_CONDITIONS.map((value) => <label key={value} className={cn("cursor-pointer rounded-sm border px-3.5 py-3 text-center text-sm transition-colors", form.overallCondition === value ? "border-brand-blue bg-brand-blue-light font-semibold text-accent-navy" : "border-surface-tertiary hover:border-brand-blue/60")}><input id={value === BOOK_CONDITIONS[0] ? "overallCondition" : undefined} type="radio" name="condition" value={value} checked={form.overallCondition === value} onChange={() => update("overallCondition", value)} className="sr-only" aria-invalid={!!errors.overallCondition} />{optionLabel("conditions", value)}</label>)}</div>{errorText("overallCondition")}</fieldset>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-7">
            <fieldset><legend className="text-sm font-semibold text-text-primary">{t.handover} <span className="text-red-600">*</span></legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{HANDOVER_METHODS.map((value) => <label key={value} className={cn("cursor-pointer rounded-sm border px-4 py-4 text-sm transition-colors", form.handoverMethod === value ? "border-brand-blue bg-brand-blue-light font-semibold text-accent-navy" : "border-surface-tertiary hover:border-brand-blue/60")}><input id={value === HANDOVER_METHODS[0] ? "handoverMethod" : undefined} type="radio" name="handover" checked={form.handoverMethod === value} onChange={() => update("handoverMethod", value)} className="me-2 accent-[#5895D0]" aria-invalid={!!errors.handoverMethod} />{optionLabel("handover", value)}</label>)}</div>{errorText("handoverMethod")}</fieldset>
            {form.handoverMethod === "PICKUP" && <div><label htmlFor="detailedAddress" className="text-sm font-semibold text-text-primary">{t.address} <span className="text-red-600">*</span></label><p id="detailedAddress-hint" className="mt-1 text-sm text-text-secondary">{t.addressHint}</p><textarea id="detailedAddress" rows={3} className={inputClass} value={form.detailedAddress} onChange={(e) => update("detailedAddress", e.target.value)} autoComplete="street-address" aria-invalid={!!errors.detailedAddress} aria-describedby={describedBy("detailedAddress", true)} />{errorText("detailedAddress")}</div>}
            <div><label htmlFor="notes" className="text-sm font-semibold text-text-primary">{t.notes} <span className="font-normal text-text-secondary">({t.optional})</span></label><p id="notes-hint" className="mt-1 text-sm text-text-secondary">{t.notesHint}</p><textarea id="notes" rows={4} maxLength={2000} className={inputClass} value={form.notes} onChange={(e) => update("notes", e.target.value)} aria-describedby="notes-hint" /></div>
            <div className="rounded-xl bg-brand-blue-light p-5"><p className="text-sm leading-6 text-accent-navy">{t.routing}</p><div className="mt-5 space-y-4">{(["donationConsent", "privacyConsent", "acceptanceAcknowledged"] as const).map((key) => <div key={key}><label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-text-primary"><input id={key} type="checkbox" checked={form[key]} onChange={(e) => update(key, e.target.checked)} className="mt-1 size-4 shrink-0 accent-[#5895D0]" aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} /><span>{t[key]} <span className="text-red-600">*</span></span></label>{errorText(key)}</div>)}</div></div>
          </div>
        )}

        <div className="mt-8 min-h-6" aria-live="assertive">{requestError && <p role="alert" className="rounded-sm bg-red-50 px-4 py-3 text-sm text-red-700">{requestError}</p>}</div>
        <div className="mt-4 flex items-center justify-between border-t border-surface-secondary pt-6">
          {step > 0 ? <button type="button" onClick={() => { setErrors({}); setRequestError(""); setStep((current) => current - 1); }} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-text-secondary hover:text-accent-navy"><ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />{t.back}</button> : <span />}
          {step < 2 ? <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-sm bg-brand-blue px-6 py-3 text-sm font-semibold text-white hover:bg-brand-blue-dark">{t.next}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></button> : <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-sm bg-brand-blue px-6 py-3 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-55">{submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{submitting ? t.submitting : t.submit}</button>}
        </div>
      </form>
    </div>
  );
}
