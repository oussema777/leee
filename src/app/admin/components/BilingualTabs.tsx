"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BilingualTabsProps {
  children: (lang: "en" | "ar") => ReactNode;
}

export default function BilingualTabs({ children }: BilingualTabsProps) {
  const [lang, setLang] = useState<"en" | "ar">("en");

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-[#0f172a] rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setLang("en")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            lang === "en"
              ? "bg-brand-blue text-white"
              : "text-gray-400 hover:text-white"
          )}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLang("ar")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            lang === "ar"
              ? "bg-brand-blue text-white"
              : "text-gray-400 hover:text-white"
          )}
        >
          العربية
        </button>
      </div>
      <div dir={lang === "ar" ? "rtl" : "ltr"}>{children(lang)}</div>
    </div>
  );
}
