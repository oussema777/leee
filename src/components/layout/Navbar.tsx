"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, Search, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import Image from "next/image";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const navItems: NavItem[] = [
    {
      label: t("about"),
      href: "/about",
      children: [
        { label: locale === "ar" ? "من نحن" : "About Us", href: "/about" },
        { label: locale === "ar" ? "الأثر" : "Impact", href: "/impact" },
        { label: locale === "ar" ? "زوادة" : "Zowada", href: "/zowada" },
      ],
    },
    {
      label: t("programs"),
      href: "/programs",
      children: [
        { label: locale === "ar" ? "جميع البرامج" : "All Programs", href: "/programs" },
        { label: locale === "ar" ? "حاضنات LEE" : "LEE Incubators", href: "/programs?pillar=incubators" },
        { label: locale === "ar" ? "أكاديمية LEE" : "LEE Academy", href: "/programs?pillar=academy" },
        { label: locale === "ar" ? "عيادة أعمال LEE" : "LEE Business Clinic", href: "/programs?pillar=business-clinic" },
        { label: locale === "ar" ? "مساعدات LEE الإنسانية" : "LEE Humanitarian Aid", href: "/programs?pillar=humanitarian-aid" },
        { label: locale === "ar" ? "مركز LEE للإعلام الرقمي" : "LEE Digital Media Hub", href: "/programs?pillar=digital-media-hub" },
      ],
    },
    {
      label: t("getInvolved"),
      href: "/get-involved",
      children: [
        { label: locale === "ar" ? "رواد الأعمال" : "Entrepreneurs", href: "/get-involved/entrepreneur" },
        { label: locale === "ar" ? "موثوق من قبل" : "Trusted By", href: "/get-involved/partner" },
        { label: locale === "ar" ? "الخبراء" : "Experts", href: "/get-involved/expert" },
        { label: locale === "ar" ? "المناصرة" : "Advocates", href: "/get-involved/advocate" },
        { label: locale === "ar" ? "الوظائف" : "Careers", href: "/get-involved/careers" },
      ],
    },
    {
      label: t("media"),
      href: "/media",
      children: [
        { label: locale === "ar" ? "ذا سبارك" : "The Spark", href: "/media" },
        { label: t("events"), href: "/media/events" },
        { label: t("gallery"), href: "/media/gallery" },
        { label: t("videos"), href: "/media/videos" },
        { label: t("reports"), href: "/media/reports" },
        { label: t("testimonials"), href: "/media/testimonials" },
        { label: t("blog"), href: "/media/blog" },
        { label: t("podcast"), href: "/media/podcast" },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const alternateLocale = locale === "en" ? "ar" : "en";

  // Non-sticky on program detail pages (where program navbar takes over)
  const isProgramDetail = /^\/programs\/[^/]+/.test(pathname);

  return (
    <header className={cn(
      "z-50 bg-accent-navy border-b border-white/10",
      isProgramDetail ? "relative" : "sticky top-0"
    )}>
      <Container>
        <nav className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo-leee.png"
              alt="LEE Experience"
              width={120}
              height={40}
              className="h-10 lg:h-12 w-auto brightness-0 invert"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <div
                key={item.href}
                className="relative group"
                onMouseEnter={() =>
                  item.children && setOpenDropdown(item.href)
                }
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 text-[13px] font-medium transition-colors",
                    isActive(item.href)
                      ? "text-brand-blue-light"
                      : "text-white/80 hover:text-white"
                  )}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  )}
                </Link>

                {/* Dropdown */}
                {item.children && openDropdown === item.href && (
                  <div className="absolute top-full start-0 pt-2 min-w-[220px]">
                    <div className="bg-accent-slate shadow-xl border border-white/10 py-2 overflow-hidden">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block px-5 py-2.5 text-[13px] transition-colors",
                            isActive(child.href)
                              ? "text-brand-blue-light bg-white/10"
                              : "text-white/70 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Ask Us Button */}
            <Link
              href="/contact"
              className="px-5 py-2 text-[13px] font-semibold border-2 border-brand-blue-light text-brand-blue-light rounded-sm hover:bg-brand-blue-light hover:text-accent-navy transition-all"
            >
              {locale === "ar" ? "تواصل معنا" : "Ask Us"}
            </Link>

            {/* Language */}
            <Link
              href={pathname}
              locale={alternateLocale}
              className="px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors"
            >
              {locale === "en" ? "ع" : "EN"}
            </Link>

            {/* Search */}
            <button className="p-2 text-white/60 hover:text-white transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-white"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="lg:hidden pb-6 border-t border-white/10">
            <div className="pt-4 space-y-1">
              {navItems.map((item) => (
                <div key={item.href}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={() => !item.children && setMobileOpen(false)}
                      className={cn(
                        "flex-1 px-3 py-2.5 text-sm font-medium",
                        isActive(item.href)
                          ? "text-brand-blue-light"
                          : "text-white/80"
                      )}
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === item.href ? null : item.href
                          )
                        }
                        className="p-2"
                      >
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            openDropdown === item.href && "rotate-180"
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {item.children && openDropdown === item.href && (
                    <div className="ms-4 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "block px-3 py-2 text-sm",
                            isActive(child.href)
                              ? "text-brand-blue-light"
                              : "text-white/60"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile Actions */}
              <div className="pt-4 border-t border-white/10 space-y-3 px-3">
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-5 py-2.5 text-sm font-semibold border-2 border-brand-blue-light text-brand-blue-light rounded-sm"
                >
                  {locale === "ar" ? "تواصل معنا" : "Ask Us"}
                </Link>
                <Link
                  href={pathname}
                  locale={alternateLocale}
                  className="block text-center text-sm font-medium text-white/60"
                >
                  {locale === "en" ? "العربية" : "English"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
