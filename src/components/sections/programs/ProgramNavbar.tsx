"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface NavSection {
  id: string;
  labelEn: string;
  labelAr: string;
}

interface ProgramNavbarProps {
  programTitleEn: string;
  programTitleAr: string;
  sections: NavSection[];
}

export function ProgramNavbar({
  programTitleEn,
  programTitleAr,
  sections,
}: ProgramNavbarProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const [isSticky, setIsSticky] = useState(false);

  const handleScroll = useCallback(() => {
    setIsSticky(window.scrollY > window.innerHeight * 0.6);
    const scrollPosition = window.scrollY + 100;
    for (let i = sections.length - 1; i >= 0; i--) {
      const element = document.getElementById(sections[i].id);
      if (element && element.offsetTop <= scrollPosition) {
        setActiveSection(sections[i].id);
        break;
      }
    }
  }, [sections]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 64;
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <nav
      className={cn(
        "w-full z-40 bg-white/95 backdrop-blur-md border-b border-surface-tertiary transition-all duration-300",
        isSticky ? "fixed top-0 shadow-sm" : "relative"
      )}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-14">
          {/* Program title (desktop) */}
          <div className="hidden lg:block shrink-0 max-w-[220px]">
            <span className="text-sm font-serif font-semibold text-text-primary truncate block">
              {isAr ? programTitleAr : programTitleEn}
            </span>
          </div>

          {/* Section links */}
          <div className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-0.5">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium whitespace-nowrap transition-all relative rounded-full",
                    activeSection === section.id
                      ? "text-brand-blue bg-accent-sky"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-secondary"
                  )}
                >
                  {isAr ? section.labelAr : section.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Back */}
          <div className="hidden sm:block shrink-0">
            <Link
              href="/programs"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-brand-blue transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              {isAr ? "جميع البرامج" : "All Programs"}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
