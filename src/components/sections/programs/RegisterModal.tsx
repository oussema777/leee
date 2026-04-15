"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  programTitle?: string;
}

export function RegisterModal({ isOpen, onClose, programTitle }: RegisterModalProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/public/join-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          interest: programTitle || data.get("interest"),
          message: data.get("message"),
        }),
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={cn(
        "relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8",
        isAr && "text-right"
      )}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-serif text-2xl text-text-primary mb-2">
          {isAr ? "سجّل اهتمامك" : "Register Your Interest"}
        </h3>
        {programTitle && (
          <p className="text-brand-blue font-medium text-sm mb-6">{programTitle}</p>
        )}

        {status === "success" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-text-primary mb-2">
              {isAr ? "شكراً لتسجيلك!" : "Thank you for registering!"}
            </p>
            <p className="text-text-secondary text-sm">
              {isAr ? "سنتواصل معك قريباً." : "We'll be in touch soon."}
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-brand-blue text-white rounded-full text-sm font-semibold hover:bg-brand-blue-dark transition-colors"
            >
              {isAr ? "إغلاق" : "Close"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                name="name"
                type="text"
                required
                placeholder={isAr ? "الاسم الكامل" : "Full Name"}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors text-sm"
              />
            </div>
            <div>
              <input
                name="email"
                type="email"
                required
                placeholder={isAr ? "البريد الإلكتروني" : "Email Address"}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors text-sm"
              />
            </div>
            <div>
              <input
                name="phone"
                type="tel"
                placeholder={isAr ? "رقم الهاتف (اختياري)" : "Phone Number (optional)"}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors text-sm"
              />
            </div>
            <div>
              <textarea
                name="message"
                rows={3}
                placeholder={isAr ? "أخبرنا عن اهتمامك (اختياري)" : "Tell us about your interest (optional)"}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors resize-none text-sm"
              />
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm">
                {isAr ? "حدث خطأ. حاول مرة أخرى." : "Something went wrong. Please try again."}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 bg-brand-blue text-white rounded-xl font-semibold text-sm hover:bg-brand-blue-dark transition-colors disabled:opacity-60"
            >
              {status === "loading"
                ? (isAr ? "جارٍ الإرسال..." : "Submitting...")
                : (isAr ? "سجّل الآن" : "Register Now")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
