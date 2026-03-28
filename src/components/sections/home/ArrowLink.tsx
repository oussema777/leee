"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArrowLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function ArrowLink({ href, children, className }: ArrowLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 text-sm font-semibold text-text-primary hover:text-brand-blue-deeper transition-colors group",
        className
      )}
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-brand-blue-deeper transition-all duration-300 group-hover:w-full" />
      </span>
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5 rtl:rotate-180 rtl:group-hover:-translate-x-1.5" />
    </Link>
  );
}
