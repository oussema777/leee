import { EbookLibrary } from "@/components/ebooks/EbookLibrary";
export const metadata = { title: "My ebooks | The LEE Experience", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { return <EbookLibrary {...await params} />; }
