"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Linkedin } from "lucide-react";
import Image from "next/image";

interface TeamMember {
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  imageUrl?: string | null;
  linkedinUrl?: string | null;
}

interface ProgramTeamProps {
  members: TeamMember[];
}

export function ProgramTeam({ members }: ProgramTeamProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  if (members.length === 0) return null;

  return (
    <section id="team" className="scroll-mt-16 py-20 md:py-28 bg-surface-secondary relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[6%] end-[6%] w-14 h-14 rounded-full bg-brand-blue/[0.05] animate-[float-slow_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-[8%] start-[5%] w-10 h-10 rounded-full border-2 border-emerald-400/10 animate-[float-medium_5.5s_ease-in-out_infinite_0.4s]" />
        <div className="absolute top-[35%] start-[3%] w-3 h-3 rounded-full bg-pink-400/10 animate-[float-slow_4.5s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-[25%] end-[10%] text-amber-400/10 animate-[float-medium_5s_ease-in-out_infinite_0.7s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>
      </div>

      <Container>
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "فريق البرنامج" : "Program Team"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight">
            {isAr ? "تعرّف على الفريق" : "Meet the Team"}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
          {members.map((member, index) => (
            <div key={index} className="group">
              <div className="bg-white rounded-2xl overflow-hidden border border-surface-tertiary hover:shadow-lg hover:-translate-y-1 transition-all duration-400 text-center">
                {/* Photo */}
                <div className="relative w-full aspect-square bg-surface-tertiary overflow-hidden">
                  {member.imageUrl ? (
                    <Image
                      src={member.imageUrl}
                      alt={isAr ? member.nameAr : member.nameEn}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 50vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-3xl font-serif">
                      {(isAr ? member.nameAr : member.nameEn).charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary text-sm">
                    {isAr ? member.nameAr : member.nameEn}
                  </h3>
                  <p className="text-xs text-brand-blue font-medium mt-0.5">
                    {isAr ? member.roleAr : member.roleEn}
                  </p>
                  {member.linkedinUrl && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-7 h-7 mt-2 text-text-muted hover:text-brand-blue transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
