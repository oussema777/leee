"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Link } from "@/i18n/navigation";
import { Phone, Mail, MapPin, Rocket, Handshake, BrainCircuit } from "lucide-react";

interface ContactSectionProps {
  phone?: string;
  email?: string;
  address?: string;
  mapUrl?: string;
}

export function ContactSection({ phone, email, address, mapUrl }: ContactSectionProps = {}) {
  const t = useTranslations();
  const locale = useLocale();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Fall back to current hardcoded values if a DB-provided prop is missing.
  const phoneValue = phone?.trim() || "+961 3 002 430";
  const emailValue = email?.trim() || "info@theleeexperience.com";
  const addressValue =
    address?.trim() ||
    (locale === "ar" ? "بيروت، لبنان | القاهرة، مصر" : "Beirut, Lebanon | Cairo, Egypt");
  const mapUrlValue =
    mapUrl?.trim() ||
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d106069.67600028!2d35.4309!3d33.8938!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151f17215880a78f%3A0x729182bae99836b4!2sBeirut%2C%20Lebanon!5e0!3m2!1sen!2s!4v1";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          subject: data.get("subject"),
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
    <section className="py-20 bg-surface-secondary">
      <Container>
        {/* Welcoming phrase */}
        <AnimatedSection>
          <div className="text-center mb-6">
            <p className="text-brand-blue font-semibold text-lg md:text-xl tracking-wide">
              {locale === "ar"
                ? "يسعدنا أن نسمع منك"
                : "We would love to hear from you"}
            </p>
          </div>
        </AnimatedSection>

        {/* Movement CTA */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              {locale === "ar"
                ? "مستعد لتحويل العقلية إلى حركة؟"
                : "Ready to turn mindset into movement?"}
            </h2>
            <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
              {locale === "ar"
                ? "انضم إلى شبكتنا المتنامية من رواد الأعمال والشركاء والخبراء."
                : "Join our growing network of entrepreneurs, partners, and experts."}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/get-involved/entrepreneur">
                <Button size="lg" className="gap-2">
                  <Rocket className="w-5 h-5" />
                  {locale === "ar" ? "ابدأ مشروعك" : "Launch Your Venture"}
                </Button>
              </Link>
              <Link href="/get-involved/partner">
                <Button size="lg" variant="secondary" className="gap-2">
                  <Handshake className="w-5 h-5" />
                  {locale === "ar" ? "كن شريكاً" : "Become a Partner"}
                </Button>
              </Link>
              <Link href="/get-involved/expert">
                <Button size="lg" variant="secondary" className="gap-2">
                  <BrainCircuit className="w-5 h-5" />
                  {locale === "ar" ? "شارك خبرتك" : "Share Expertise"}
                </Button>
              </Link>
            </div>
          </div>
        </AnimatedSection>

        <SectionHeader title={t("home.contactTitle")} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <AnimatedSection>
            <div className="space-y-8">
              <ContactItem
                icon={<Phone className="w-5 h-5" />}
                label={t("common.phone")}
                value={phoneValue}
              />
              <ContactItem
                icon={<Mail className="w-5 h-5" />}
                label={t("common.email")}
                value={emailValue}
                href={`mailto:${emailValue}`}
              />
              <ContactItem
                icon={<MapPin className="w-5 h-5" />}
                label={t("common.address")}
                value={addressValue}
              />

              <div className="mt-8 overflow-hidden h-64">
                <iframe
                  src={mapUrlValue}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Contact Form */}
          <AnimatedSection delay={0.2}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <input
                  name="name"
                  type="text"
                  required
                  placeholder={t("common.name")}
                  className="w-full px-4 py-3 border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={t("common.email")}
                  className="w-full px-4 py-3 border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors"
                />
              </div>
              <input
                name="subject"
                type="text"
                placeholder={t("common.subject")}
                className="w-full px-4 py-3 border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors"
              />
              <textarea
                name="message"
                required
                rows={6}
                placeholder={t("common.message")}
                className="w-full px-4 py-3 border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-colors resize-none"
              />

              {status === "success" && (
                <p className="text-green-600 text-sm font-medium">
                  {t("contact.successMessage")}
                </p>
              )}
              {status === "error" && (
                <p className="text-red-600 text-sm font-medium">
                  {t("contact.errorMessage")}
                </p>
              )}

              <Button type="submit" size="lg" isLoading={status === "loading"} className="w-full sm:w-auto">
                {t("common.sendMessage")}
              </Button>
            </form>
          </AnimatedSection>
        </div>
      </Container>
    </section>
  );
}

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-text-muted mb-0.5">{label}</p>
        {href ? (
          <a href={href} className="text-text-primary font-medium hover:text-brand-blue transition-colors">
            {value}
          </a>
        ) : (
          <p className="text-text-primary font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}
