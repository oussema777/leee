import type { Metadata } from "next";
import { WhishPaymentPage } from "@/components/sections/books/WhishPaymentPage";
export const metadata: Metadata = {
  title: "Book Restore payment | The LEE Experience",
  robots: { index: false, follow: false }, referrer: "no-referrer",
};
export default async function PaymentPage({ params }: { params: Promise<{ locale: string; reference: string }> }) {
  const { locale, reference } = await params;
  return <WhishPaymentPage locale={locale} reference={reference} />;
}
