"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { ArrowLeft } from "lucide-react";

export function ProgramMiniFooter() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <footer className="bg-brand-black text-white py-12">
      <Container>
        <div className="flex flex-col items-center text-center gap-6">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white px-6 py-3 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {isAr ? "العودة لجميع البرامج" : "Back to All Programs"}
          </Link>

          <div className="text-gray-500 text-sm">
            <p className="font-semibold text-gray-400 mb-1">The LEE Experience</p>
            <p>
              {isAr
                ? "معاً نحو عالم يناسبنا جميعاً"
                : "Together towards a world that suits us all."}
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="/" className="hover:text-brand-blue transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <Link href="/contact" className="hover:text-brand-blue transition-colors">
              {isAr ? "اتصل بنا" : "Contact Us"}
            </Link>
            <Link href="/programs" className="hover:text-brand-blue transition-colors">
              {isAr ? "البرامج" : "Programs"}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
