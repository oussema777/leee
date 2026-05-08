import { SparkPage } from "@/components/sections/media/SparkPage";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata({
    title: locale === "ar" ? "الإعلام — تجربة LEE" : "Media — The LEE Experience",
    description: locale === "ar" ? "استكشف أحدث الأخبار والفعاليات والموارد من تجربة LEE." : "Explore the latest news, events, and resources from The LEE Experience.",
    path: "media",
    locale,
  });
}

export default function MediaPage() {
  return <SparkPage />;
}
