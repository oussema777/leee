"use client";

import { useRef, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  className?: string;
  backgroundImage?: string;
  /** Compact hero (no image, dark gradient only) */
  compact?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  className,
  backgroundImage,
  compact,
}: PageHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const hasImage = !!backgroundImage;

  return (
    <section
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        hasImage
          ? "min-h-[480px] md:min-h-[560px] lg:min-h-[620px]"
          : "py-20 md:py-28",
        className
      )}
    >
      {/* Background image */}
      {hasImage && (
        <>
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-accent-navy/85 via-accent-navy/75 to-accent-navy/95" />
          <div className="absolute inset-0 grain-overlay pointer-events-none" />
        </>
      )}

      {/* Simple gradient for compact headers */}
      {!hasImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-accent-navy via-accent-slate to-brand-blue-deeper" />
      )}

      {/* Floating animated shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
        {/* Large blue circle — top right */}
        <div className="absolute top-[10%] end-[8%] w-20 h-20 rounded-full bg-brand-blue/20 animate-[float-slow_6s_ease-in-out_infinite]" />
        {/* Small teal dot — left */}
        <div className="absolute top-[35%] start-[5%] w-4 h-4 rounded-full bg-emerald-400/40 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
        {/* Ring — right */}
        <div className="absolute top-[55%] end-[15%] w-12 h-12 rounded-full border-2 border-white/15 animate-[float-slow_7s_ease-in-out_infinite_1s]" />
        {/* Pink dot — top center */}
        <div className="absolute top-[18%] start-[45%] w-3 h-3 rounded-full bg-pink-400/30 animate-[float-medium_4s_ease-in-out_infinite_0.8s]" />
        {/* Amber star — bottom right */}
        <div className="absolute bottom-[25%] end-[25%] text-amber-400/30 animate-[float-slow_5.5s_ease-in-out_infinite_1.2s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>
        {/* Blue cross — center left */}
        <div className="absolute top-[60%] start-[12%] text-brand-blue/25 animate-[float-medium_6.5s_ease-in-out_infinite_0.3s] rotate-45">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="10" y="2" width="4" height="20" rx="2" />
            <rect x="2" y="10" width="20" height="4" rx="2" />
          </svg>
        </div>
        {/* Small white ring */}
        <div className="absolute top-[40%] end-[35%] w-6 h-6 rounded-full border border-white/10 animate-[float-slow_8s_ease-in-out_infinite_2s]" />
      </div>

      {/* Content */}
      <div
        className={cn(
          "relative z-10 flex items-center",
          hasImage && "min-h-[480px] md:min-h-[560px] lg:min-h-[620px]"
        )}
      >
        <Container>
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              className={cn(
                "flex items-center gap-2 text-sm text-white/50 mb-6 transition-all duration-700 ease-out",
                visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3"
              )}
            >
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-white transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white/70">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {/* Title */}
          <h1
            className={cn(
              "font-serif text-4xl md:text-5xl lg:text-6xl xl:text-[4rem] text-white leading-[1.05] tracking-tight max-w-3xl transition-all duration-800 ease-out",
              visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            )}
            style={{ transitionDelay: "0.15s" }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p
              className={cn(
                "mt-5 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed transition-all duration-800 ease-out",
                visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: "0.3s" }}
            >
              {subtitle}
            </p>
          )}

          {/* Accent line */}
          <div
            className={cn(
              "mt-8 w-16 h-[3px] bg-brand-blue rounded-full transition-all duration-800 ease-out",
              visible
                ? "opacity-100 scale-x-100"
                : "opacity-0 scale-x-0"
            )}
            style={{ transitionDelay: "0.45s", transformOrigin: "left" }}
          />
        </Container>
      </div>

      {/* Wave SVG divider at bottom */}
      {hasImage && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto block"
            preserveAspectRatio="none"
          >
            <path
              d="M0 60L48 55C96 50 192 40 288 38C384 36 480 42 576 52C672 62 768 76 864 78C960 80 1056 70 1152 60C1248 50 1344 40 1392 35L1440 30V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z"
              fill="#E8F1FB"
              fillOpacity="0.15"
            />
            <path
              d="M0 80L48 76C96 72 192 64 288 60C384 56 480 56 576 62C672 68 768 80 864 84C960 88 1056 84 1152 76C1248 68 1344 56 1392 50L1440 44V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V80Z"
              fill="#E8F1FB"
              fillOpacity="0.4"
            />
            <path
              d="M0 96L48 94C96 92 192 88 288 84C384 80 480 76 576 78C672 80 768 88 864 92C960 96 1056 96 1152 92C1248 88 1344 80 1392 76L1440 72V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V96Z"
              fill="#E8F1FB"
            />
          </svg>
        </div>
      )}
    </section>
  );
}
