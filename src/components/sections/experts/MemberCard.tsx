"use client";

import { useLocale } from "next-intl";
import Image from "next/image";
import { Linkedin, Instagram, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { XIcon } from "@/lib/socialLinks";
import type { ShowcaseMember } from "@/lib/data/members";

// Cycled accent per card: lively but cohesive, applied subtly (thin ring, label, glow).
const accents = [
  { text: "text-brand-blue", ring: "ring-brand-blue/40", glow: "bg-brand-blue/20", wash: "from-brand-blue/10" },
  { text: "text-emerald-600", ring: "ring-emerald-400/40", glow: "bg-emerald-400/20", wash: "from-emerald-400/10" },
  { text: "text-amber-600", ring: "ring-amber-400/40", glow: "bg-amber-400/20", wash: "from-amber-400/10" },
  { text: "text-pink-600", ring: "ring-pink-400/40", glow: "bg-pink-400/20", wash: "from-pink-400/10" },
  { text: "text-violet-600", ring: "ring-violet-400/40", glow: "bg-violet-400/20", wash: "from-violet-400/10" },
  { text: "text-cyan-600", ring: "ring-cyan-400/40", glow: "bg-cyan-400/20", wash: "from-cyan-400/10" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function MemberCard({
  member,
  index,
  visible,
}: {
  member: ShowcaseMember;
  index: number;
  visible: boolean;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const name = isAr ? member.nameAr || member.nameEn : member.nameEn;
  const title = isAr ? member.titleAr || member.titleEn : member.titleEn;
  const bio = isAr ? member.bioAr : member.bioEn;
  const accent = accents[index % accents.length];

  const socials = [
    { url: member.linkedinUrl, label: "LinkedIn", Icon: Linkedin },
    { url: member.twitterUrl, label: "X", Icon: XIcon },
    { url: member.instagramUrl, label: "Instagram", Icon: Instagram },
    { url: member.websiteUrl, label: "Website", Icon: Globe },
  ].filter((s) => s.url && s.url.trim() !== "");

  return (
    <div
      className={cn(
        "group h-full transition-all duration-700 ease-out motion-reduce:transition-none",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 motion-reduce:opacity-100 motion-reduce:translate-y-0"
      )}
      style={{ transitionDelay: `${Math.min(index, 8) * 80}ms` }}
    >
      <div className="relative flex flex-col items-center text-center h-full overflow-hidden bg-surface-card rounded-3xl border border-surface-tertiary/70 px-8 py-10 shadow-[0_4px_24px_-14px_rgba(27,58,92,0.18)] hover:shadow-[0_22px_50px_-18px_rgba(27,58,92,0.30)] hover:-translate-y-1.5 transition-all duration-500 motion-reduce:transition-none">
        {/* Soft accent wash at the top of the card */}
        <span aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b to-transparent opacity-70", accent.wash)} />

        {/* Avatar */}
        <div className="relative z-10 mb-6 flex items-center justify-center">
          <span
            aria-hidden
            className={cn(
              "absolute -inset-2 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 motion-reduce:transition-none",
              accent.glow
            )}
          />
          <div className={cn(
            "relative z-10 w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-surface-card shadow-md ring-2 ring-offset-4 ring-offset-surface-card transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none",
            accent.ring
          )}>
            {member.imageUrl ? (
              <Image
                src={member.imageUrl}
                alt={name}
                fill
                className="object-cover"
                sizes="144px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-blue/15 to-emerald-400/15">
                <span className="font-serif text-4xl text-brand-blue/55">{initials(name)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="relative z-10 flex flex-col items-center">
          <h3 className="font-serif text-2xl text-text-primary tracking-tight">{name}</h3>
          <p className={cn("mt-2 text-[11px] font-bold uppercase tracking-[0.18em]", accent.text)}>{title}</p>
          {bio && (
            <p className="mt-4 text-text-secondary text-sm leading-relaxed max-w-[32ch]">{bio}</p>
          )}
          {socials.length > 0 && (
            <div className="mt-6 flex items-center gap-2.5">
              {socials.map(({ url, label, Icon }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} on ${label}`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-surface-tertiary text-text-muted hover:border-brand-blue hover:text-brand-blue hover:bg-brand-blue/5 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
