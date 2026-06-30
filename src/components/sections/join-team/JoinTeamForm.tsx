"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

interface FormState {
  name: string;
  title: string;
  photoUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  websiteUrl: string;
}

const initial: FormState = {
  name: "",
  title: "",
  photoUrl: "",
  linkedinUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  websiteUrl: "",
};

export function JoinTeamForm({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations("joinTeam");
  const isAr = locale === "ar";

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const required = isAr ? "مطلوب" : "Required";
  const optional = isAr ? "اختياري" : "Optional";

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = required;
    if (!form.title.trim()) errs.title = required;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        photoUrl: isAr ? "الحجم الأقصى 5 ميغابايت" : "Max file size is 5MB",
      }));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/public/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      set("photoUrl", data.url);
    } catch {
      setErrors((prev) => ({
        ...prev,
        photoUrl: isAr ? "فشل الرفع. حاول مرة أخرى." : "Upload failed. Please try again.",
      }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");
    try {
      const body: Record<string, string> = {
        token,
        name: form.name,
        title: form.title,
        locale,
      };
      if (form.photoUrl) body.photoUrl = form.photoUrl;
      if (form.linkedinUrl.trim()) body.linkedinUrl = form.linkedinUrl.trim();
      if (form.twitterUrl.trim()) body.twitterUrl = form.twitterUrl.trim();
      if (form.instagramUrl.trim()) body.instagramUrl = form.instagramUrl.trim();
      if (form.websiteUrl.trim()) body.websiteUrl = form.websiteUrl.trim();

      const res = await fetch("/api/public/team-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error ||
            (isAr ? "حدث خطأ ما. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again.")
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isAr
          ? "حدث خطأ ما. يرجى المحاولة مرة أخرى."
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">{t("success")}</h3>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-slate-50"
    >
      <div className="w-full max-w-xl bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">{t("title")}</h1>
          <p className="text-sm text-text-secondary">{t("intro")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              {t("name")}
              <span className="text-red-500 ms-1">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={cn(
                "w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all",
                errors.name ? "border-red-400" : "border-gray-200"
              )}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Role / Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              {t("role")}
              <span className="text-red-500 ms-1">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={cn(
                "w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all",
                errors.title ? "border-red-400" : "border-gray-200"
              )}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Photo Upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">{t("photo")}</label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                form.photoUrl
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-gray-200 hover:border-brand-blue/50"
              )}
            >
              {form.photoUrl ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {isAr ? "تم رفع الصورة" : "Photo uploaded"}
                  </span>
                  <button
                    type="button"
                    onClick={() => set("photoUrl", "")}
                    className="text-xs text-gray-500 underline ms-2"
                  >
                    {isAr ? "إزالة" : "Remove"}
                  </button>
                </div>
              ) : uploading ? (
                <div className="flex items-center justify-center gap-2 text-brand-blue">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{isAr ? "جارٍ الرفع..." : "Uploading..."}</span>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-text-secondary">
                    {isAr ? "JPEG أو PNG أو WebP، بحد أقصى 5 ميغابايت" : "JPEG, PNG, or WebP, max 5MB"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>
            {errors.photoUrl && <p className="text-xs text-red-500">{errors.photoUrl}</p>}
          </div>

          {/* Social / URL fields */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              {t("linkedin")}
              <span className="text-gray-400 text-xs ms-1.5">({optional})</span>
            </label>
            <input
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => set("linkedinUrl", e.target.value)}
              placeholder="https://linkedin.com/in/…"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              {t("x")}
              <span className="text-gray-400 text-xs ms-1.5">({optional})</span>
            </label>
            <input
              type="url"
              value={form.twitterUrl}
              onChange={(e) => set("twitterUrl", e.target.value)}
              placeholder="https://x.com/…"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              {t("instagram")}
              <span className="text-gray-400 text-xs ms-1.5">({optional})</span>
            </label>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) => set("instagramUrl", e.target.value)}
              placeholder="https://instagram.com/…"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              {t("website")}
              <span className="text-gray-400 text-xs ms-1.5">({optional})</span>
            </label>
            <input
              type="url"
              value={form.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)}
              placeholder="https://…"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors disabled:opacity-50 rounded-lg"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? isAr
                  ? "جارٍ الإرسال..."
                  : "Submitting…"
                : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
