import { EbookReader } from "@/components/ebooks/EbookReader";
export const metadata = { title: "Read ebook | The LEE Experience", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) { return <EbookReader {...await params} />; }
