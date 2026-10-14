import { EbookStore } from "@/components/ebooks/EbookStore";
export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) { return <EbookStore {...await params} />; }
