"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Upload, ShieldCheck } from "lucide-react";

// ── Option lists ────────────────────────────────────────────────────────────
// value = English string POSTed to the API
// tKey  = key under t("countryOptions.*") / t("degreeOptions.*") etc.

const COUNTRIES: { value: string; tKey: string }[] = [
  { value: "United States", tKey: "unitedStates" },
  { value: "Canada", tKey: "canada" },
  { value: "United Kingdom", tKey: "unitedKingdom" },
  { value: "Germany", tKey: "germany" },
  { value: "France", tKey: "france" },
  { value: "India", tKey: "india" },
  { value: "Australia", tKey: "australia" },
  { value: "Brazil", tKey: "brazil" },
  { value: "Japan", tKey: "japan" },
  { value: "South Africa", tKey: "southAfrica" },
  { value: "Syria", tKey: "syria" },
  { value: "Iraq", tKey: "iraq" },
  { value: "Yemen", tKey: "yemen" },
  { value: "Egypt", tKey: "egypt" },
  { value: "GCC", tKey: "gcc" },
  { value: "Tunis", tKey: "tunis" },
  { value: "Morocco", tKey: "morocco" },
  { value: "Lybia", tKey: "libya" },
  { value: "Algeria", tKey: "algeria" },
  { value: "Sudan", tKey: "sudan" },
  { value: "Jordan", tKey: "jordan" },
  { value: "Palestine", tKey: "palestine" },
  { value: "Other", tKey: "other" },
];

const DEGREES: { value: string; tKey: string }[] = [
  { value: "Associate Degree", tKey: "associate" },
  { value: "Bachelor's Degree (BA, BS, BBA, etc.)", tKey: "bachelor" },
  { value: "Master's Degree (MA, MS, MBA, MED, MPA,etc.)", tKey: "master" },
  { value: "Doctorate (PhD, EdD, DBA, DSc,etc.)", tKey: "doctorate" },
  {
    value: "Professional Doctorate (MD, DO,DDS, DVM, PharmD ,JD, etc.)",
    tKey: "professionalDoctorate",
  },
  { value: "Post-Doctoral Fellowship", tKey: "postDoc" },
  { value: "Other", tKey: "other" },
];

const EXPERIENCE_OPTIONS: { value: string; tKey: string }[] = [
  { value: "0-2 years", tKey: "0to2" },
  { value: "3-5 years", tKey: "3to5" },
  { value: "6-10 years", tKey: "6to10" },
  { value: "11-15 years", tKey: "11to15" },
  { value: "16-20 years", tKey: "16to20" },
  { value: "20+ years", tKey: "20plus" },
];

const RATE_OPTIONS: { value: string; tKey: string }[] = [
  { value: "50 USD", tKey: "r50" },
  { value: "100 USD", tKey: "r100" },
  { value: "150 USD", tKey: "r150" },
  { value: "200 USD", tKey: "r200" },
  { value: "250 USD", tKey: "r250" },
  { value: "300 USD", tKey: "r300" },
  { value: "350 USD", tKey: "r350" },
  { value: "400 USD", tKey: "r400" },
  { value: "450 USD", tKey: "r450" },
  { value: "500 USD", tKey: "r500" },
  { value: "Case by Case", tKey: "caseByCase" },
  { value: "Other", tKey: "other" },
];

// ── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  fullName: string;
  professionalTitle: string;
  countries: string[];
  countriesOther: string;
  phone: string;
  email: string;
  linkedinUrl: string;
  photoUrl: string;
  photoConsent: boolean;
  degrees: string[];
  degreesOther: string;
  degreeDetails: string;
  majorFieldOfStudy: string;
  yearsExperience: string;
  certifications: string;
  licensesMemberships: string;
  shortBio: string;
  expertiseKeywords: string;
  notableWork: string;
  languages: string;
  availableForEngagements: string;
  dailyRate: string;
  dailyRateOther: string;
  publishConsent: string;
}

const INITIAL: FormState = {
  fullName: "",
  professionalTitle: "",
  countries: [],
  countriesOther: "",
  phone: "",
  email: "",
  linkedinUrl: "",
  photoUrl: "",
  photoConsent: false,
  degrees: [],
  degreesOther: "",
  degreeDetails: "",
  majorFieldOfStudy: "",
  yearsExperience: "",
  certifications: "",
  licensesMemberships: "",
  shortBio: "",
  expertiseKeywords: "",
  notableWork: "",
  languages: "",
  availableForEngagements: "",
  dailyRate: "",
  dailyRateOther: "",
  publishConsent: "",
};

type ErrorMap = Record<string, string>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
      <h2 className="text-base font-semibold text-brand-blue uppercase tracking-wide">
        {title}
      </h2>
    </div>
  );
}

function FieldLabel({
  label,
  required,
  optional,
  hint,
}: {
  label: string;
  required?: boolean;
  optional?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-0.5 mb-1.5">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
        {optional && !required && (
          <span className="text-gray-400 text-xs ms-1.5">({optional})</span>
        )}
      </label>
      {hint && <p className="text-xs text-gray-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-red-500 mt-1">{error}</p>;
}

const INPUT_BASE =
  "w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all";

// ── Main component ───────────────────────────────────────────────────────────

export function ExpertApplyForm({ locale }: { locale: string }) {
  const t = useTranslations("expertApply");
  const isAr = locale === "ar";

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");

  // ── Setters ────────────────────────────────────────────────────────────────

  const setField = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const toggleCheckbox = (key: "countries" | "degrees", value: string) => {
    setForm((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ── Photo upload ───────────────────────────────────────────────────────────

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photoUrl: t("photoNote") }));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/public/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url: string };
      setField("photoUrl", data.url);
    } catch {
      setErrors((prev) => ({ ...prev, photoUrl: t("errorBanner") }));
    } finally {
      setUploading(false);
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): ErrorMap => {
    const errs: ErrorMap = {};
    const req = t("fieldRequired");
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRx = /^https?:\/\/.+/;

    if (!form.fullName.trim()) errs.fullName = req;
    if (!form.professionalTitle.trim()) errs.professionalTitle = req;

    // countries: after processing Other, must have >=1
    const resolvedCountries = form.countries.filter((c) => c !== "Other");
    if (form.countries.includes("Other") && form.countriesOther.trim())
      resolvedCountries.push(form.countriesOther.trim());
    if (resolvedCountries.length === 0) errs.countries = t("selectAtLeastOne");

    if (!form.phone.trim()) errs.phone = req;
    if (!form.email.trim()) errs.email = req;
    else if (!emailRx.test(form.email)) errs.email = t("invalidEmail");

    if (form.linkedinUrl.trim() && !urlRx.test(form.linkedinUrl.trim()))
      errs.linkedinUrl = t("invalidUrl");

    if (!form.photoUrl) errs.photoUrl = t("photoRequired");
    if (!form.photoConsent) errs.photoConsent = t("mustAgree");

    // degrees: after processing Other, must have >=1
    const resolvedDegrees = form.degrees.filter((d) => d !== "Other");
    if (form.degrees.includes("Other") && form.degreesOther.trim())
      resolvedDegrees.push(form.degreesOther.trim());
    if (resolvedDegrees.length === 0) errs.degrees = t("selectAtLeastOne");

    if (!form.degreeDetails.trim()) errs.degreeDetails = req;
    if (!form.majorFieldOfStudy.trim()) errs.majorFieldOfStudy = req;
    if (!form.yearsExperience) errs.yearsExperience = t("selectOne");
    if (!form.certifications.trim()) errs.certifications = req;
    if (!form.shortBio.trim()) errs.shortBio = req;
    if (!form.expertiseKeywords.trim()) errs.expertiseKeywords = req;
    if (!form.languages.trim()) errs.languages = req;
    if (!form.availableForEngagements) errs.availableForEngagements = t("selectOne");

    const effectiveDailyRate =
      form.dailyRate === "Other" ? form.dailyRateOther.trim() : form.dailyRate;
    if (!effectiveDailyRate) errs.dailyRate = t("selectOne");

    if (!form.publishConsent) errs.publishConsent = t("selectOne");

    return errs;
  };

  // ── Build payload ──────────────────────────────────────────────────────────

  const buildPayload = () => {
    const countries = form.countries.filter((c) => c !== "Other");
    if (form.countries.includes("Other") && form.countriesOther.trim())
      countries.push(form.countriesOther.trim());

    const degrees = form.degrees.filter((d) => d !== "Other");
    if (form.degrees.includes("Other") && form.degreesOther.trim())
      degrees.push(form.degreesOther.trim());

    const dailyRate =
      form.dailyRate === "Other" ? form.dailyRateOther.trim() : form.dailyRate;

    return {
      fullName: form.fullName,
      professionalTitle: form.professionalTitle,
      countries,
      phone: form.phone,
      email: form.email,
      ...(form.linkedinUrl.trim() ? { linkedinUrl: form.linkedinUrl.trim() } : {}),
      photoUrl: form.photoUrl,
      photoConsent: form.photoConsent,
      degrees,
      degreeDetails: form.degreeDetails,
      majorFieldOfStudy: form.majorFieldOfStudy,
      yearsExperience: form.yearsExperience,
      certifications: form.certifications,
      ...(form.licensesMemberships.trim()
        ? { licensesMemberships: form.licensesMemberships.trim() }
        : {}),
      shortBio: form.shortBio,
      expertiseKeywords: form.expertiseKeywords,
      ...(form.notableWork.trim() ? { notableWork: form.notableWork.trim() } : {}),
      languages: form.languages,
      availableForEngagements: form.availableForEngagements,
      dailyRate,
      publishConsent: form.publishConsent === "yes",
      website: "", // honeypot
    };
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // scroll to first error field
      const firstKey = Object.keys(errs)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    setErrorBanner("");
    try {
      const res = await fetch("/api/public/expert-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json() as {
        ok: boolean;
        error?: string;
        fields?: Record<string, string>;
      };
      if (data.ok) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (data.error === "validation" && data.fields) {
        setErrors(data.fields);
        const firstKey = Object.keys(data.fields)[0];
        document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (data.error === "rate_limited") {
        setErrorBanner(t("rateLimited"));
      } else {
        setErrorBanner(t("errorBanner"));
      }
    } catch {
      setErrorBanner(t("errorBanner"));
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-3">
          {t("successTitle")}
        </h3>
        <p className="text-text-secondary max-w-md mx-auto">{t("success")}</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
      <form onSubmit={handleSubmit} noValidate className="space-y-12">

        {/* ── Section 1: Personal Information ─────────────────────────── */}
        <section>
          <SectionHeader title={t("sectionPersonal")} />
          <div className="space-y-5">

            {/* Full Name */}
            <div id="field-fullName">
              <FieldLabel label={t("fullName")} required />
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                className={cn(INPUT_BASE, errors.fullName ? "border-red-400" : "border-gray-200")}
              />
              <FieldError error={errors.fullName} />
            </div>

            {/* Professional Title */}
            <div id="field-professionalTitle">
              <FieldLabel
                label={t("professionalTitle")}
                required
                hint={t("professionalTitleHint")}
              />
              <input
                type="text"
                value={form.professionalTitle}
                onChange={(e) => setField("professionalTitle", e.target.value)}
                className={cn(INPUT_BASE, errors.professionalTitle ? "border-red-400" : "border-gray-200")}
              />
              <FieldError error={errors.professionalTitle} />
            </div>

            {/* Countries (multi-select checkboxes) */}
            <div id="field-countries">
              <FieldLabel
                label={t("countries")}
                required
                hint={t("countriesHint")}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {COUNTRIES.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-all",
                      form.countries.includes(opt.value)
                        ? "border-brand-blue bg-brand-blue/8 text-text-primary font-medium"
                        : "border-gray-200 text-text-secondary hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={form.countries.includes(opt.value)}
                      onChange={() => toggleCheckbox("countries", opt.value)}
                      className="accent-[#5895D0] shrink-0"
                    />
                    <span className="leading-tight">{t(`countryOptions.${opt.tKey}`)}</span>
                  </label>
                ))}
              </div>
              {form.countries.includes("Other") && (
                <input
                  type="text"
                  value={form.countriesOther}
                  onChange={(e) => setField("countriesOther", e.target.value)}
                  placeholder={t("otherCountry")}
                  className={cn(INPUT_BASE, "border-gray-200 mt-2")}
                />
              )}
              <FieldError error={errors.countries} />
            </div>

            {/* Phone */}
            <div id="field-phone">
              <FieldLabel label={t("phone")} required />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={cn(INPUT_BASE, errors.phone ? "border-red-400" : "border-gray-200")}
              />
              <FieldError error={errors.phone} />
            </div>

            {/* Email */}
            <div id="field-email">
              <FieldLabel label={t("email")} required hint={t("emailHint")} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={cn(INPUT_BASE, errors.email ? "border-red-400" : "border-gray-200")}
              />
              <FieldError error={errors.email} />
            </div>

            {/* LinkedIn (optional) */}
            <div id="field-linkedinUrl">
              <FieldLabel label={t("linkedinUrl")} optional={t("optional")} />
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={(e) => setField("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className={cn(INPUT_BASE, errors.linkedinUrl ? "border-red-400" : "border-gray-200")}
              />
              <FieldError error={errors.linkedinUrl} />
            </div>

            {/* Photo upload (required) */}
            <div id="field-photoUrl">
              <FieldLabel label={t("photo")} required />
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  form.photoUrl
                    ? "border-emerald-300 bg-emerald-50"
                    : errors.photoUrl
                    ? "border-red-300"
                    : "border-gray-200 hover:border-brand-blue/50"
                )}
              >
                {form.photoUrl ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">{t("photoUploaded")}</span>
                    <button
                      type="button"
                      onClick={() => setField("photoUrl", "")}
                      className="text-xs text-gray-500 underline ms-2"
                    >
                      {t("remove")}
                    </button>
                  </div>
                ) : uploading ? (
                  <div className="flex items-center justify-center gap-2 text-brand-blue">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">{t("uploadingLabel")}</span>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-text-secondary">{t("photoNote")}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>
              <FieldError error={errors.photoUrl} />
            </div>

            {/* Photo consent checkbox */}
            <div id="field-photoConsent">
              <label
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border rounded-lg cursor-pointer text-sm transition-all",
                  form.photoConsent
                    ? "border-brand-blue bg-brand-blue/5"
                    : errors.photoConsent
                    ? "border-red-300"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="checkbox"
                  checked={form.photoConsent}
                  onChange={(e) => setField("photoConsent", e.target.checked)}
                  className="accent-[#5895D0] mt-0.5 shrink-0"
                />
                <span className="text-text-secondary leading-relaxed">
                  {t("photoConsent")}
                  <span className="text-red-500 ms-1">*</span>
                </span>
              </label>
              <FieldError error={errors.photoConsent} />
            </div>

          </div>
        </section>

        {/* ── Section 2: Academic Degrees ──────────────────────────────── */}
        <section>
          <SectionHeader title={t("sectionDegrees")} />
          <div className="space-y-5">

            {/* Degrees (multi-select checkboxes) */}
            <div id="field-degrees">
              <FieldLabel
                label={t("degrees")}
                required
                hint={t("degreesHint")}
              />
              <div className="flex flex-col gap-2 mt-1">
                {DEGREES.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer text-sm transition-all",
                      form.degrees.includes(opt.value)
                        ? "border-brand-blue bg-brand-blue/8 text-text-primary font-medium"
                        : "border-gray-200 text-text-secondary hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={form.degrees.includes(opt.value)}
                      onChange={() => toggleCheckbox("degrees", opt.value)}
                      className="accent-[#5895D0] shrink-0"
                    />
                    {t(`degreeOptions.${opt.tKey}`)}
                  </label>
                ))}
              </div>
              {form.degrees.includes("Other") && (
                <input
                  type="text"
                  value={form.degreesOther}
                  onChange={(e) => setField("degreesOther", e.target.value)}
                  placeholder={t("otherDegree")}
                  className={cn(INPUT_BASE, "border-gray-200 mt-2")}
                />
              )}
              <FieldError error={errors.degrees} />
            </div>

            {/* Degree Details */}
            <div id="field-degreeDetails">
              <FieldLabel
                label={t("degreeDetails")}
                required
                hint={t("degreeDetailsHint")}
              />
              <textarea
                value={form.degreeDetails}
                onChange={(e) => setField("degreeDetails", e.target.value)}
                placeholder={t("degreeDetailsPlaceholder")}
                rows={4}
                className={cn(
                  INPUT_BASE,
                  "resize-none",
                  errors.degreeDetails ? "border-red-400" : "border-gray-200"
                )}
              />
              <FieldError error={errors.degreeDetails} />
            </div>

            {/* Major Field of Study */}
            <div id="field-majorFieldOfStudy">
              <FieldLabel
                label={t("majorFieldOfStudy")}
                required
                hint={t("majorFieldOfStudyHint")}
              />
              <input
                type="text"
                value={form.majorFieldOfStudy}
                onChange={(e) => setField("majorFieldOfStudy", e.target.value)}
                className={cn(INPUT_BASE, errors.majorFieldOfStudy ? "border-red-400" : "border-gray-200")}
              />
              <FieldError error={errors.majorFieldOfStudy} />
            </div>

          </div>
        </section>

        {/* ── Section 3: Professional Experience & Credentials ─────────── */}
        <section>
          <SectionHeader title={t("sectionExperience")} />
          <div className="space-y-5">

            {/* Years of Experience (single radio) */}
            <div id="field-yearsExperience">
              <FieldLabel label={t("yearsExperience")} required />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer text-sm transition-all",
                      form.yearsExperience === opt.value
                        ? "border-brand-blue bg-brand-blue/8 text-text-primary font-medium"
                        : "border-gray-200 text-text-secondary hover:border-gray-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="yearsExperience"
                      value={opt.value}
                      checked={form.yearsExperience === opt.value}
                      onChange={() => setField("yearsExperience", opt.value)}
                      className="accent-[#5895D0] shrink-0"
                    />
                    {t(`experienceOptions.${opt.tKey}`)}
                  </label>
                ))}
              </div>
              <FieldError error={errors.yearsExperience} />
            </div>

            {/* Certifications */}
            <div id="field-certifications">
              <FieldLabel
                label={t("certifications")}
                required
                hint={t("certificationsHint")}
              />
              <textarea
                value={form.certifications}
                onChange={(e) => setField("certifications", e.target.value)}
                placeholder={t("certificationsPlaceholder")}
                rows={4}
                className={cn(
                  INPUT_BASE,
                  "resize-none",
                  errors.certifications ? "border-red-400" : "border-gray-200"
                )}
              />
              <FieldError error={errors.certifications} />
            </div>

            {/* Licenses & Memberships (optional) */}
            <div id="field-licensesMemberships">
              <FieldLabel
                label={t("licensesMemberships")}
                optional={t("optional")}
                hint={t("licensesMembershipsHint")}
              />
              <textarea
                value={form.licensesMemberships}
                onChange={(e) => setField("licensesMemberships", e.target.value)}
                rows={3}
                className={cn(INPUT_BASE, "resize-none border-gray-200")}
              />
            </div>

            {/* Short Bio */}
            <div id="field-shortBio">
              <FieldLabel
                label={t("shortBio")}
                required
                hint={t("shortBioHint")}
              />
              <textarea
                value={form.shortBio}
                onChange={(e) => setField("shortBio", e.target.value)}
                rows={5}
                className={cn(
                  INPUT_BASE,
                  "resize-none",
                  errors.shortBio ? "border-red-400" : "border-gray-200"
                )}
              />
              <FieldError error={errors.shortBio} />
            </div>

          </div>
        </section>

        {/* ── Section 4: Area of Expertise ─────────────────────────────── */}
        <section>
          <SectionHeader title={t("sectionExpertise")} />
          <div className="space-y-5">

            {/* Expertise Keywords */}
            <div id="field-expertiseKeywords">
              <FieldLabel
                label={t("expertiseKeywords")}
                required
                hint={t("expertiseKeywordsHint")}
              />
              <input
                type="text"
                value={form.expertiseKeywords}
                onChange={(e) => setField("expertiseKeywords", e.target.value)}
                placeholder={t("expertiseKeywordsPlaceholder")}
                className={cn(INPUT_BASE, errors.expertiseKeywords ? "border-red-400" : "border-gray-200")}
              />
              <FieldError error={errors.expertiseKeywords} />
            </div>

            {/* Notable Work (optional) */}
            <div id="field-notableWork">
              <FieldLabel
                label={t("notableWork")}
                optional={t("optional")}
                hint={t("notableWorkHint")}
              />
              <textarea
                value={form.notableWork}
                onChange={(e) => setField("notableWork", e.target.value)}
                rows={4}
                className={cn(INPUT_BASE, "resize-none border-gray-200")}
              />
            </div>

            {/* Languages */}
            <div id="field-languages">
              <FieldLabel
                label={t("languages")}
                required
                hint={t("languagesHint")}
              />
              <input
                type="text"
                value={form.languages}
                onChange={(e) => setField("languages", e.target.value)}
                placeholder={t("languagesPlaceholder")}
                className={cn(INPUT_BASE, errors.languages ? "border-red-400" : "border-gray-200")}
              />
              <FieldError error={errors.languages} />
            </div>

          </div>
        </section>

        {/* ── Section 5: Publishing Consent & Availability ─────────────── */}
        <section>
          <SectionHeader title={t("sectionConsent")} />
          <div className="space-y-5">

            {/* Available for Engagements (Yes / No) */}
            <div id="field-availableForEngagements">
              <FieldLabel label={t("availableForEngagements")} required />
              <div className="flex gap-3 mt-1">
                {(["Yes", "No"] as const).map((v) => (
                  <label
                    key={v}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer text-sm transition-all flex-1",
                      form.availableForEngagements === v
                        ? "border-brand-blue bg-brand-blue/10 text-text-primary font-medium"
                        : "border-gray-200 text-text-secondary hover:border-gray-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="availableForEngagements"
                      value={v}
                      checked={form.availableForEngagements === v}
                      onChange={() => setField("availableForEngagements", v)}
                      className="accent-[#5895D0]"
                    />
                    {v === "Yes" ? t("availableYes") : t("availableNo")}
                  </label>
                ))}
              </div>
              <FieldError error={errors.availableForEngagements} />
            </div>

            {/* Daily Rate (single select radio) */}
            <div id="field-dailyRate">
              <FieldLabel label={t("dailyRate")} required />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {RATE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer text-sm transition-all",
                      form.dailyRate === opt.value
                        ? "border-brand-blue bg-brand-blue/8 text-text-primary font-medium"
                        : "border-gray-200 text-text-secondary hover:border-gray-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="dailyRate"
                      value={opt.value}
                      checked={form.dailyRate === opt.value}
                      onChange={() => setField("dailyRate", opt.value)}
                      className="accent-[#5895D0] shrink-0"
                    />
                    <span className="leading-tight">{t(`rateOptions.${opt.tKey}`)}</span>
                  </label>
                ))}
              </div>
              {form.dailyRate === "Other" && (
                <input
                  type="text"
                  value={form.dailyRateOther}
                  onChange={(e) => setField("dailyRateOther", e.target.value)}
                  placeholder={t("dailyRateOther")}
                  className={cn(INPUT_BASE, "border-gray-200 mt-2")}
                />
              )}
              <FieldError error={errors.dailyRate} />
            </div>

            {/* Publish Consent */}
            <div id="field-publishConsent">
              <div className="bg-brand-blue/5 border border-brand-blue/15 rounded-lg p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-1">
                      {t("publishConsent")}
                      <span className="text-red-500 ms-1">*</span>
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {t("publishConsentHint")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {(["yes", "no"] as const).map((v) => (
                    <label
                      key={v}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer text-sm transition-all flex-1",
                        form.publishConsent === v
                          ? "border-brand-blue bg-brand-blue/10 text-text-primary font-medium"
                          : "border-gray-200 text-text-secondary hover:border-gray-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="publishConsent"
                        checked={form.publishConsent === v}
                        onChange={() => setField("publishConsent", v)}
                        className="accent-[#5895D0]"
                      />
                      {v === "yes" ? t("publishConsentYes") : t("publishConsentNo")}
                    </label>
                  ))}
                </div>
                <FieldError error={errors.publishConsent} />
              </div>
            </div>

          </div>
        </section>

        {/* ── Honeypot (hidden) ─────────────────────────────────────────── */}
        <input
          type="text"
          name="website"
          value={form.publishConsent ? "" : ""}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          onChange={() => {}}
        />

        {/* ── Error banner ──────────────────────────────────────────────── */}
        {errorBanner && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {errorBanner}
          </div>
        )}

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors disabled:opacity-50 rounded-lg"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t("submitting") : t("submit")}
          </button>
        </div>

      </form>
    </div>
  );
}
