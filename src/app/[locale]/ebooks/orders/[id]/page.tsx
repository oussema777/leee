import { EbookPayment } from "@/components/ebooks/EbookPayment";
export const metadata = { title: "Ebook order | The LEE Experience", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) { return <EbookPayment {...await params} />; }
