"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { socialLinks } from "@/lib/socialLinks";

export function SocialMediaBar() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="py-8 md:py-10 bg-surface-secondary/50 border-t border-surface-tertiary/30">
      <Container>
        <div className="flex flex-col items-center gap-4">
          <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">
            {isAr ? "تابعونا" : "Follow Us"}
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    "bg-accent-navy/10 text-text-secondary",
                    "hover:bg-brand-blue hover:text-white transition-all duration-300",
                    "hover:shadow-lg hover:-translate-y-0.5"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
