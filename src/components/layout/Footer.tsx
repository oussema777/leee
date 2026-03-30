"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-accent-navy border-t border-white/10">
      <Container className="py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo-leee.png"
                alt="LEE Experience"
                width={144}
                height={48}
                className="h-12 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              {locale === "ar"
                ? "تجربة LEEE هي منظومة للتأثير الاجتماعي، تقدم بيئة حيوية لدعم المجتمعات والشباب ورواد الأعمال الاجتماعيين في لبنان."
                : "The LEEE Experience is an ecosystem for social impact, providing a dynamic environment to support communities, youth and social entrepreneurs in Lebanon."}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              {locale === "ar" ? "روابط سريعة" : "Quick Links"}
            </h3>
            <ul className="space-y-3">
              <FooterLink href="/about">{t("nav.about")}</FooterLink>
              <FooterLink href="/programs">{t("nav.programs")}</FooterLink>
              <FooterLink href="/impact">{locale === "ar" ? "الأثر" : "Impact"}</FooterLink>
              <FooterLink href="/zowada">{locale === "ar" ? "زوادة" : "Zowada"}</FooterLink>
              <FooterLink href="/get-involved">{locale === "ar" ? "شارك" : "Get Involved"}</FooterLink>
              <FooterLink href="/media/events">{t("nav.events")}</FooterLink>
              <FooterLink href="/media/blog">{locale === "ar" ? "المدونة" : "Blog"}</FooterLink>
            </ul>
          </div>

          {/* Column 3: Get In Touch */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              {locale === "ar" ? "تواصل معنا" : "Get In Touch"}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm">
                  {locale === "ar" ? "بيروت، لبنان" : "Beirut, Lebanon"}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm">+961 3 002 430</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:info@theleeexperience.com"
                  className="text-white/60 text-sm hover:text-brand-blue-light transition-colors"
                >
                  info@theleeexperience.com
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Follow / Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              {locale === "ar" ? "تابعنا" : "Follow The Spark"}
            </h3>
            <p className="text-white/60 text-sm mb-4">
              {locale === "ar"
                ? "النشرة الإخبارية هي نشرة أسبوعية تبقيك على اطلاع ببرامجنا وشركائنا ومجتمعاتنا."
                : "The LEEE Spark is a weekly roundup that keeps you connected to our programs, partners and communities."}
            </p>

            {/* Newsletter Subscribe */}
            <div className="mb-6">
              <button className="px-5 py-2 text-xs font-semibold uppercase tracking-wider border-2 border-brand-blue-light text-brand-blue-light rounded-sm hover:bg-brand-blue-light hover:text-accent-navy transition-all">
                {locale === "ar" ? "اشترك" : "Subscribe"}
              </button>

            </div>

            {/* Social Icons */}
            <div className="flex gap-3">
              <SocialIcon href="https://www.facebook.com/theleeexperience/" icon={<Facebook className="w-4 h-4" />} />
              <SocialIcon href="https://twitter.com/lee_experience" icon={<Twitter className="w-4 h-4" />} />
              <SocialIcon href="https://www.instagram.com/the_lee_experience/" icon={<Instagram className="w-4 h-4" />} />
              <SocialIcon href="https://www.linkedin.com/company/the-lee-experience" icon={<Linkedin className="w-4 h-4" />} />
              <SocialIcon href="https://www.youtube.com/" icon={<Youtube className="w-4 h-4" />} />
            </div>
          </div>
        </div>

      </Container>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-accent-slate">
        <Container className="py-4">
          <p className="text-white/50 text-xs text-center">
            &copy; {currentYear} The LEEE Experience. {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
        </Container>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-white/60 text-sm hover:text-brand-blue-light transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-8 h-8 bg-white/10 flex items-center justify-center text-white/60 hover:bg-brand-blue hover:text-white transition-all"
    >
      {icon}
    </a>
  );
}
