"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  User,
  Briefcase,
  Target,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Upload,
} from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  organization: string;
  role: string;
  sector: string;
  experience: string;
  interestArea: string;
  motivation: string;
  cvUrl: string;
}

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  nationality: "",
  organization: "",
  role: "",
  sector: "",
  experience: "",
  interestArea: "",
  motivation: "",
  cvUrl: "",
};

const interestAreas = [
  { en: "Volunteering", ar: "التطوع" },
  { en: "Training & Capacity Building", ar: "التدريب وبناء القدرات" },
  { en: "Mentorship & Coaching", ar: "الإرشاد والتوجيه" },
  { en: "Research & Data Analysis", ar: "البحث وتحليل البيانات" },
  { en: "Digital Media & Marketing", ar: "الإعلام الرقمي والتسويق" },
  { en: "Program Management", ar: "إدارة البرامج" },
  { en: "Fundraising & Partnerships", ar: "جمع التبرعات والشراكات" },
  { en: "Humanitarian Response", ar: "الاستجابة الإنسانية" },
  { en: "Other", ar: "أخرى" },
];

const sectors = [
  { en: "NGO / Non-Profit", ar: "منظمة غير حكومية" },
  { en: "Private Sector", ar: "القطاع الخاص" },
  { en: "Public Sector / Government", ar: "القطاع العام / الحكومة" },
  { en: "Academia / Research", ar: "الأكاديمية / البحث" },
  { en: "International Organization", ar: "منظمة دولية" },
  { en: "Freelancer / Independent", ar: "مستقل" },
  { en: "Student", ar: "طالب" },
  { en: "Other", ar: "أخرى" },
];

const content = {
  en: {
    step1: "Personal Information",
    step2: "Professional Background",
    step3: "Area of Interest",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    phone: "Phone Number",
    nationality: "Nationality",
    organization: "Organization / Company",
    role: "Current Role / Job Title",
    sector: "Sector",
    experience: "Relevant Experience",
    experiencePlaceholder: "Briefly describe your relevant experience, skills, or background...",
    interestArea: "Area of Interest",
    motivation: "Why do you want to join?",
    motivationPlaceholder: "Tell us about your motivation and what you hope to contribute...",
    cv: "Upload CV (Optional)",
    cvNote: "PDF or DOC, max 5MB",
    next: "Next",
    back: "Back",
    submit: "Submit Application",
    submitting: "Submitting...",
    required: "Required",
    successTitle: "Application Submitted!",
    successMessage: "Thank you for your interest in joining The LEEE Experience. We will review your application and get back to you soon.",
    successBack: "Back to Home",
    errorMessage: "Something went wrong. Please try again.",
    selectSector: "Select your sector...",
    selectInterest: "Select area of interest...",
    optional: "Optional",
  },
  ar: {
    step1: "المعلومات الشخصية",
    step2: "الخلفية المهنية",
    step3: "مجال الاهتمام",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    nationality: "الجنسية",
    organization: "المنظمة / الشركة",
    role: "المسمى الوظيفي الحالي",
    sector: "القطاع",
    experience: "الخبرة ذات الصلة",
    experiencePlaceholder: "صف بإيجاز خبرتك ومهاراتك أو خلفيتك ذات الصلة...",
    interestArea: "مجال الاهتمام",
    motivation: "لماذا تريد الانضمام؟",
    motivationPlaceholder: "أخبرنا عن دافعك وما تأمل في المساهمة به...",
    cv: "تحميل السيرة الذاتية (اختياري)",
    cvNote: "PDF أو DOC، بحد أقصى 5 ميغابايت",
    next: "التالي",
    back: "السابق",
    submit: "إرسال الطلب",
    submitting: "جارٍ الإرسال...",
    required: "مطلوب",
    successTitle: "تم إرسال الطلب!",
    successMessage: "شكراً لاهتمامك بالانضمام إلى تجربة LEEE. سنراجع طلبك ونعود إليك قريباً.",
    successBack: "العودة إلى الرئيسية",
    errorMessage: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    selectSector: "اختر قطاعك...",
    selectInterest: "اختر مجال الاهتمام...",
    optional: "اختياري",
  },
};

const steps = [
  { icon: User, key: "step1" as const },
  { icon: Briefcase, key: "step2" as const },
  { icon: Target, key: "step3" as const },
];

export function JoinUsForm() {
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

  const validateStep = (s: number) => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (s === 0) {
      if (!form.firstName.trim()) errs.firstName = t.required;
      if (!form.lastName.trim()) errs.lastName = t.required;
      if (!form.email.trim()) errs.email = t.required;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 2));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, cvUrl: "File too large (max 5MB)" }));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "join-us/cv");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      set("cvUrl", data.url);
    } catch {
      setErrors((prev) => ({ ...prev, cvUrl: "Upload failed" }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/public/join-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t.errorMessage);
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
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 mt-[-1.5rem]",
                    isDone ? "bg-emerald-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Info */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                label={t.firstName}
                value={form.firstName}
                onChange={(v) => set("firstName", v)}
                error={errors.firstName}
                required
              />
              <FormField
                label={t.lastName}
                value={form.lastName}
                onChange={(v) => set("lastName", v)}
                error={errors.lastName}
                required
              />
            </div>
            <FormField
              label={t.email}
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              error={errors.email}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                label={t.phone}
                type="tel"
                value={form.phone}
                onChange={(v) => set("phone", v)}
                optional={t.optional}
              />
              <FormField
                label={t.nationality}
                value={form.nationality}
                onChange={(v) => set("nationality", v)}
                optional={t.optional}
              />
            </div>
          </div>
        )}

        {/* Step 2: Professional Background */}
        {step === 1 && (
          <div className="space-y-5">
            <FormField
              label={t.organization}
              value={form.organization}
              onChange={(v) => set("organization", v)}
              optional={t.optional}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                label={t.role}
                value={form.role}
                onChange={(v) => set("role", v)}
                optional={t.optional}
              />
              <FormSelect
                label={t.sector}
                value={form.sector}
                onChange={(v) => set("sector", v)}
                placeholder={t.selectSector}
                options={sectors.map((s) => ({
                  label: isAr ? s.ar : s.en,
                  value: s.en,
                }))}
                optional={t.optional}
              />
            </div>
            <FormTextarea
              label={t.experience}
              value={form.experience}
              onChange={(v) => set("experience", v)}
              placeholder={t.experiencePlaceholder}
              optional={t.optional}
            />
          </div>
        )}

        {/* Step 3: Interest & Motivation */}
        {step === 2 && (
          <div className="space-y-5">
            <FormSelect
              label={t.interestArea}
              value={form.interestArea}
              onChange={(v) => set("interestArea", v)}
              placeholder={t.selectInterest}
              options={interestAreas.map((a) => ({
                label: isAr ? a.ar : a.en,
                value: a.en,
              }))}
              optional={t.optional}
            />
            <FormTextarea
              label={t.motivation}
              value={form.motivation}
              onChange={(v) => set("motivation", v)}
              placeholder={t.motivationPlaceholder}
              rows={5}
              optional={t.optional}
            />

            {/* CV Upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                {t.cv}
              </label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  form.cvUrl ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-brand-blue/50"
                )}
              >
                {form.cvUrl ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">CV uploaded</span>
                    <button
                      type="button"
                      onClick={() => set("cvUrl", "")}
                      className="text-xs text-gray-500 underline ms-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : uploading ? (
                  <div className="flex items-center justify-center gap-2 text-brand-blue">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-text-secondary">{t.cvNote}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
              {errors.cvUrl && <p className="text-xs text-red-500">{errors.cvUrl}</p>}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              {t.back}
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors"
            >
              {t.next}
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t.submitting : t.submit}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function FormField({
  label,
  value,
  onChange,
  error,
  required,
  optional,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  optional?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
        {optional && !required && (
          <span className="text-gray-400 text-xs ms-1.5">({optional})</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all",
          error ? "border-red-400" : "border-gray-200"
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  optional?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {optional && <span className="text-gray-400 text-xs ms-1.5">({optional})</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  optional?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {optional && <span className="text-gray-400 text-xs ms-1.5">({optional})</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all resize-none"
      />
    </div>
  );
}
