"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Quote,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { FormField, FormSelect, FormTextarea } from "./fields";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  governorate: string;
  program: string;
  quote: string;
  consent: "" | "yes" | "no";
  photoUrl: string;
  motivation: string;
  challenges: string;
  skillsGained: string;
  valuableLesson: string;
  lifeImpact: string;
  results: string;
  successStory: string;
  adviceToOthers: string;
  additionalComments: string;
}

const initialForm: FormData = {
  fullName: "", email: "", phone: "", businessName: "",
  governorate: "", program: "", quote: "", consent: "", photoUrl: "",
  motivation: "", challenges: "", skillsGained: "", valuableLesson: "",
  lifeImpact: "", results: "", successStory: "", adviceToOthers: "",
  additionalComments: "",
};

// Stored values are stable English keys (see spec §4).
const governorates = [
  { en: "Akkar", ar: "عكار" },
  { en: "North Lebanon", ar: "الشمال" },
  { en: "South Lebanon", ar: "الجنوب" },
  { en: "Beirut", ar: "بيروت" },
  { en: "Mount Lebanon", ar: "جبل لبنان" },
  { en: "Nabatieh", ar: "النبطية" },
  { en: "Bekaa", ar: "البقاع" },
  { en: "Baalbek-Hermel", ar: "بعلبك الهرمل" },
];

const programs = [
  { en: "LEE Incubation", ar: "حاضنة LEE" },
  { en: "LEE Acceleration", ar: "مسرعة LEE" },
  { en: "LEE Humanitarian Aid", ar: "LEE للمساعدات الإنسانية" },
  { en: "LEE Digital Media Hub", ar: "مركز LEE للإعلام الرقمي" },
  { en: "LEE Academy", ar: "أكاديمية LEE" },
  { en: "LEE Business Clinic", ar: "عيادة الأعمال LEE" },
];

const content = {
  en: {
    step1: "Your Testimonial",
    step2: "Tell Us More (Optional)",
    fullName: "Full Name",
    email: "Email Address",
    emailHint: "Never published — only so our team can verify and follow up with you.",
    phone: "Phone Number",
    businessName: "Business / Project Name",
    governorate: "Governorate",
    selectGovernorate: "Select your governorate...",
    program: "Which program or service did you participate in?",
    selectProgram: "Select a program...",
    quote: "Your testimonial",
    quotePlaceholder: "A short quote that reflects your experience with LEEE...",
    photo: "Upload Photo (Optional)",
    photoNote: "JPEG, PNG, or WebP, max 5MB",
    photoUploaded: "Photo uploaded",
    remove: "Remove",
    uploadingLabel: "Uploading...",
    privacyTitle: "Your privacy",
    privacyBody:
      "Only your quote, name, photo, and project information may be published — and only if you agree below. Your email and phone stay internal and are never shared. To request removal later, email info@theleeexperience.com.",
    consentLabel: "May we publish your testimonial, name, photo, and project information on our website and social media?",
    consentYes: "Yes, you may publish it",
    consentNo: "No, keep it internal",
    motivation: "What motivated you to join the program?",
    challenges: "What were the main challenges you were facing before participating?",
    skillsGained: "What skills, knowledge, or support did you gain through the program?",
    valuableLesson: "What is the most valuable lesson you learned?",
    lifeImpact: "How has the program impacted your personal or professional life?",
    results: "Have you achieved any specific results or milestones after participating?",
    resultsPlaceholder: "Examples: started a business, found employment, increased income, improved confidence, expanded network...",
    successStory: "Can you share a success story or achievement that makes you proud?",
    adviceToOthers: "What would you say to someone considering joining this program?",
    additionalComments: "Additional Comments",
    optionalIntro: "These questions are optional — they help us understand and improve our programs. Feel free to skip any or all of them.",
    next: "Continue",
    back: "Back",
    submit: "Submit My Story",
    submitting: "Submitting...",
    required: "Required",
    invalidEmail: "Invalid email",
    quoteTooShort: "Please write at least a sentence (10+ characters)",
    consentRequired: "Please choose Yes or No",
    successTitle: "Thank You for Sharing!",
    successMessage:
      "Your story has been received. Our team will review it, and if you agreed to publication, it may appear on our website soon.",
    successBack: "Back to Home",
    errorMessage: "Something went wrong. Please try again.",
    rateLimited: "Too many submissions. Please try again later.",
    optional: "Optional",
  },
  ar: {
    step1: "شهادتك",
    step2: "أخبرنا المزيد (اختياري)",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    emailHint: "لن يُنشر أبداً — فقط ليتمكن فريقنا من التحقق والتواصل معك.",
    phone: "رقم الهاتف",
    businessName: "اسم العمل / المشروع",
    governorate: "المحافظة",
    selectGovernorate: "اختر محافظتك...",
    program: "في أي برنامج أو خدمة شاركت؟",
    selectProgram: "اختر البرنامج...",
    quote: "شهادتك",
    quotePlaceholder: "اقتباس قصير يعكس تجربتك مع LEEE...",
    photo: "تحميل صورة (اختياري)",
    photoNote: "JPEG أو PNG أو WebP، بحد أقصى 5 ميغابايت",
    photoUploaded: "تم تحميل الصورة",
    remove: "إزالة",
    uploadingLabel: "جارٍ التحميل...",
    privacyTitle: "خصوصيتك",
    privacyBody:
      "قد يُنشر فقط اقتباسك واسمك وصورتك ومعلومات مشروعك — وفقط إذا وافقت أدناه. يبقى بريدك الإلكتروني وهاتفك داخليين ولا تتم مشاركتهما أبداً. لطلب الإزالة لاحقاً، راسلنا على info@theleeexperience.com.",
    consentLabel: "هل يمكننا نشر شهادتك واسمك وصورتك ومعلومات مشروعك على موقعنا الإلكتروني ووسائل التواصل الاجتماعي؟",
    consentYes: "نعم، يمكنكم النشر",
    consentNo: "لا، أبقوها داخلية",
    motivation: "ما الذي حفزك للانضمام إلى البرنامج؟",
    challenges: "ما هي التحديات الرئيسية التي كنت تواجهها قبل المشاركة؟",
    skillsGained: "ما المهارات أو المعرفة أو الدعم الذي اكتسبته من خلال البرنامج؟",
    valuableLesson: "ما هو أثمن درس تعلمته؟",
    lifeImpact: "كيف أثّر البرنامج على حياتك الشخصية أو المهنية؟",
    results: "هل حققت نتائج أو إنجازات محددة بعد المشاركة؟",
    resultsPlaceholder: "أمثلة: بدأت عملاً، وجدت وظيفة، زاد دخلي، تحسنت ثقتي، توسعت شبكتي...",
    successStory: "هل يمكنك مشاركة قصة نجاح أو إنجاز تفتخر به؟",
    adviceToOthers: "ماذا تقول لشخص يفكر في الانضمام إلى هذا البرنامج؟",
    additionalComments: "تعليقات إضافية",
    optionalIntro: "هذه الأسئلة اختيارية — تساعدنا على فهم برامجنا وتحسينها. لا تتردد في تخطي أي منها أو جميعها.",
    next: "متابعة",
    back: "السابق",
    submit: "أرسل قصتي",
    submitting: "جارٍ الإرسال...",
    required: "مطلوب",
    invalidEmail: "بريد إلكتروني غير صالح",
    quoteTooShort: "يرجى كتابة جملة على الأقل (10 أحرف أو أكثر)",
    consentRequired: "يرجى اختيار نعم أو لا",
    successTitle: "شكراً لمشاركتك!",
    successMessage:
      "تم استلام قصتك. سيراجعها فريقنا، وإذا وافقت على النشر، فقد تظهر على موقعنا قريباً.",
    successBack: "العودة إلى الرئيسية",
    errorMessage: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    rateLimited: "محاولات كثيرة جداً. يرجى المحاولة لاحقاً.",
    optional: "اختياري",
  },
};

const steps = [
  { icon: Quote, key: "step1" as const },
  { icon: ClipboardList, key: "step2" as const },
];

export function ShareStoryForm() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = content[isAr ? "ar" : "en"];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const set = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep1 = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.fullName.trim()) errs.fullName = t.required;
    if (!form.email.trim()) errs.email = t.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t.invalidEmail;
    if (form.quote.trim().length < 10) errs.quote = form.quote.trim() ? t.quoteTooShort : t.required;
    if (form.consent === "") errs.consent = t.consentRequired;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep1()) setStep(1);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photoUrl: t.photoNote }));
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/public/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      set("photoUrl", data.url);
    } catch {
      setErrors((prev) => ({ ...prev, photoUrl: t.errorMessage }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) { setStep(0); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/public/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          consent: form.consent === "yes",
          locale: isAr ? "ar" : "en",
          website: "", // honeypot
        }),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error(t.rateLimited);
        throw new Error(t.errorMessage);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-3">{t.successTitle}</h3>
        <p className="text-text-secondary max-w-md mx-auto mb-8">{t.successMessage}</p>
        <a
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-medium hover:bg-brand-blue/90 transition-colors"
        >
          {t.successBack}
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-10">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all mb-2",
                    isActive
                      ? "border-brand-blue bg-brand-blue text-white"
                      : isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-200 bg-white text-gray-400"
                  )}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium text-center",
                    isActive ? "text-brand-blue" : isDone ? "text-emerald-600" : "text-gray-400"
                  )}
                >
                  {t[s.key]}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-0.5 flex-1 mx-2 mt-[-1.5rem]", isDone ? "bg-emerald-500" : "bg-gray-200")} />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 0 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label={t.fullName} value={form.fullName} onChange={(v) => set("fullName", v)} error={errors.fullName} required />
              <FormField label={t.businessName} value={form.businessName} onChange={(v) => set("businessName", v)} optional={t.optional} />
            </div>
            <FormField label={t.email} type="email" value={form.email} onChange={(v) => set("email", v)} error={errors.email} required hint={t.emailHint} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label={t.phone} type="tel" value={form.phone} onChange={(v) => set("phone", v)} optional={t.optional} />
              <FormSelect
                label={t.governorate} value={form.governorate} onChange={(v) => set("governorate", v)}
                placeholder={t.selectGovernorate} optional={t.optional}
                options={governorates.map((g) => ({ label: isAr ? g.ar : g.en, value: g.en }))}
              />
            </div>
            <FormSelect
              label={t.program} value={form.program} onChange={(v) => set("program", v)}
              placeholder={t.selectProgram} optional={t.optional}
              options={programs.map((p) => ({ label: isAr ? p.ar : p.en, value: p.en }))}
            />
            <FormTextarea label={t.quote} value={form.quote} onChange={(v) => set("quote", v)} placeholder={t.quotePlaceholder} rows={4} required error={errors.quote} />

            {/* Photo upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">{t.photo}</label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  form.photoUrl ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-brand-blue/50"
                )}
              >
                {form.photoUrl ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">{t.photoUploaded}</span>
                    <button type="button" onClick={() => set("photoUrl", "")} className="text-xs text-gray-500 underline ms-2">
                      {t.remove}
                    </button>
                  </div>
                ) : uploading ? (
                  <div className="flex items-center justify-center gap-2 text-brand-blue">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">{t.uploadingLabel}</span>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-text-secondary">{t.photoNote}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
              {errors.photoUrl && <p className="text-xs text-red-500">{errors.photoUrl}</p>}
            </div>

            {/* Privacy notice + consent */}
            <div className="bg-brand-blue/5 border border-brand-blue/15 rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">{t.privacyTitle}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{t.privacyBody}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">
                  {t.consentLabel}
                  <span className="text-red-500 ms-1">*</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {(["yes", "no"] as const).map((v) => (
                    <label
                      key={v}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer text-sm transition-all flex-1",
                        form.consent === v ? "border-brand-blue bg-brand-blue/10 text-text-primary font-medium" : "border-gray-200 text-text-secondary hover:border-gray-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="consent"
                        checked={form.consent === v}
                        onChange={() => set("consent", v)}
                        className="accent-[#5895D0]"
                      />
                      {v === "yes" ? t.consentYes : t.consentNo}
                    </label>
                  ))}
                </div>
                {errors.consent && <p className="text-xs text-red-500">{errors.consent}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <p className="text-sm text-text-secondary bg-gray-50 border border-gray-100 rounded-lg p-4">{t.optionalIntro}</p>
            <FormTextarea label={t.motivation} value={form.motivation} onChange={(v) => set("motivation", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.challenges} value={form.challenges} onChange={(v) => set("challenges", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.skillsGained} value={form.skillsGained} onChange={(v) => set("skillsGained", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.valuableLesson} value={form.valuableLesson} onChange={(v) => set("valuableLesson", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.lifeImpact} value={form.lifeImpact} onChange={(v) => set("lifeImpact", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.results} value={form.results} onChange={(v) => set("results", v)} placeholder={t.resultsPlaceholder} optional={t.optional} rows={3} />
            <FormTextarea label={t.successStory} value={form.successStory} onChange={(v) => set("successStory", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.adviceToOthers} value={form.adviceToOthers} onChange={(v) => set("adviceToOthers", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.additionalComments} value={form.additionalComments} onChange={(v) => set("additionalComments", v)} optional={t.optional} rows={3} />
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(0)} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              {t.back}
            </button>
          ) : (
            <div />
          )}

          {step === 0 ? (
            <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors">
              {t.next}
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <button type="submit" disabled={loading || uploading} className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t.submitting : t.submit}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
