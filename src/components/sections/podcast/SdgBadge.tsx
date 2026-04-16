"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { sdgs } from "./sdgData";

interface SdgBadgeProps {
  sdgNumber: number;
  size?: "sm" | "md";
}

/**
 * Renders an official UN SDG icon. Icons at `public/images/sdg/sdg-{n}.jpg`
 * are downloaded from sdgs.un.org (official 466×466 colored square tiles).
 */
export function SdgBadge({ sdgNumber, size = "sm" }: SdgBadgeProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sdg = sdgs[sdgNumber];
  if (!sdg) return null;

  const title = isAr ? sdg.titleAr : sdg.titleEn;
  const label = isAr ? `الهدف ${sdgNumber}` : `SDG ${sdgNumber}`;
  const alt = `${label} — ${title}`;

  if (size === "md") {
    return (
      <div className="flex flex-col items-center gap-2">
        <Image
          src={sdg.iconPath}
          alt={alt}
          width={72}
          height={72}
          className="w-16 h-16 object-contain shadow-sm"
        />
        <span
          className="text-[10px] font-semibold leading-tight text-center max-w-[96px]"
          style={{ color: sdg.color }}
        >
          {title}
        </span>
      </div>
    );
  }

  return (
    <span
      className="inline-block shrink-0"
      title={alt}
      aria-label={alt}
    >
      <Image
        src={sdg.iconPath}
        alt={alt}
        width={28}
        height={28}
        className="w-7 h-7 object-contain"
      />
    </span>
  );
}
