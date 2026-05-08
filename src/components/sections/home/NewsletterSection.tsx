"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { motion } from "framer-motion";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

export function NewsletterSection() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");

  const text = {
    title: isAr ? "ابقَ على اطلاع" : "Stay in the Loop",
    subtitle: isAr
      ? "اشترك في نشرة LEE Spark الأسبوعية لتصلك آخر أخبار برامجنا وشراكاتنا ومجتمعاتنا."
      : "Subscribe to The LEE Spark — our weekly roundup of programs, partnerships, and community stories.",
    placeholder: isAr ? "أدخل بريدك الإلكتروني" : "Enter your email address",
    button: isAr ? "اشترك الآن" : "Subscribe",
    success: isAr ? "شكراً لاشتراكك! ترقّب نشرتنا القادمة." : "You're in! Watch your inbox for The LEE Spark.",
    already: isAr ? "هذا البريد مسجّل بالفعل. شكراً لمتابعتك!" : "You're already subscribed. Thanks for staying connected!",
    error: isAr ? "حدث خطأ. حاول مرة أخرى." : "Something went wrong. Please try again.",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        return;
      }

      if (data.alreadySubscribed) {
        setStatus("already");
      } else {
        setStatus("success");
        setEmail("");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="relative py-14 md:py-16 bg-surface-primary overflow-hidden">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-blue/10 mb-6">
            <Mail className="w-6 h-6 text-brand-blue" />
          </div>

          <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] text-accent-navy mb-4">
            {text.title}
          </h2>
          <p className="text-text-secondary text-lg mb-8 leading-relaxed">
            {text.subtitle}
          </p>

          {status === "success" || status === "already" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-6 py-4"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                {status === "success" ? text.success : text.already}
              </span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder={text.placeholder}
                required
                dir={isAr ? "rtl" : "ltr"}
                className="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 bg-white text-accent-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all text-sm"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-8 py-3.5 bg-brand-blue text-white font-semibold rounded-xl hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm whitespace-nowrap"
              >
                {status === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isAr ? "جارٍ..." : "..."}
                  </span>
                ) : (
                  text.button
                )}
              </button>
            </form>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mt-3 text-red-600 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {text.error}
            </motion.div>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
