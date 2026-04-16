"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface CareerApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  careerSlug: string;
  careerTitleEn: string;
  careerTitleAr: string;
}

type Status = "idle" | "loading" | "success" | "error";
type ErrorKind = "validation" | "not_found" | "closed" | "server" | "network";

export function CareerApplyModal({
  isOpen,
  onClose,
  careerSlug,
  careerTitleEn,
  careerTitleAr,
}: CareerApplyModalProps) {
  const locale = useLocale();
  const t = useTranslations("careers.apply");
  const isAr = locale === "ar";
  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);

  if (!isOpen) return null;

  const title = isAr ? careerTitleAr : careerTitleEn;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorKind(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const honeypot = String(data.get("website") ?? "");
    if (honeypot.length > 0) {
      setStatus("success");
      form.reset();
      return;
    }

    try {
      const res = await fetch("/api/public/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerSlug,
          fullName: data.get("fullName"),
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          resumeUrl: data.get("resumeUrl") || undefined,
          coverLetter: data.get("coverLetter"),
        }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: ErrorKind; fields?: Record<string, string> }
        | null;

      if (res.ok && payload?.ok === true) {
        setStatus("success");
        form.reset();
        return;
      }

      if (payload && payload.ok === false) {
        setErrorKind(payload.error);
      } else {
        setErrorKind("server");
      }
      setStatus("error");
    } catch {
      setErrorKind("network");
      setStatus("error");
    }
  };

  const errorMessage = () => {
    if (errorKind === "validation") return t("errorValidation");
    if (errorKind === "not_found") return t("errorNotFound");
    if (errorKind === "closed") return t("errorClosed");
    return t("errorGeneric");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8",
          isAr && "text-right"
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label={isAr ? "إغلاق" : "Close"}
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-serif text-2xl text-text-primary mb-2">
          {t("title", { position: title })}
        </h3>

        {status === "success" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-text-primary text-sm">{t("success")}</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-brand-blue text-white rounded-full text-sm font-semibold hover:bg-brand-blue-dark transition-colors"
            >
              {isAr ? "إغلاق" : "Close"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-10000px] top-auto w-px h-px overflow-hidden"
              aria-hidden="true"
            />

            <input
              name="fullName"
              type="text"
              required
              minLength={2}
              placeholder={t("fullName")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors text-sm"
            />
            <input
              name="email"
              type="email"
              required
              placeholder={t("email")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors text-sm"
            />
            <input
              name="phone"
              type="tel"
              placeholder={t("phone")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors text-sm"
            />
            <div>
              <input
                name="resumeUrl"
                type="url"
                placeholder={t("resumeUrl")}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors text-sm"
              />
              <p className="text-xs text-text-muted mt-1">{t("resumeUrlHelper")}</p>
            </div>
            <textarea
              name="coverLetter"
              rows={6}
              required
              minLength={20}
              maxLength={5000}
              placeholder={t("coverLetter")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors resize-none text-sm"
            />

            {status === "error" && (
              <p className="text-red-500 text-sm" role="alert">
                {errorMessage()}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 bg-brand-blue text-white rounded-xl font-semibold text-sm hover:bg-brand-blue-dark transition-colors disabled:opacity-60"
            >
              {status === "loading" ? t("submitting") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
