import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { BlogGrid } from "@/components/sections/blog/BlogGrid";
import { getBlogPosts } from "@/lib/data/blog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const description =
    locale === "ar"
      ? "أدلة إرشادية وتدريبات تعليمية ورؤى وقصص حول بناء الأعمال المرنة، والاقتصاد الأخضر، والمبتكرات من النساء في منطقة الشرق الأوسط وشمال أفريقيا."
      : "How-to guides, training tutorials, insights, and stories on building resilient businesses, the green economy, and women innovators across MENA.";
  return buildPageMetadata({
    title: t("pageTitle"),
    description,
    path: "media/blog",
    locale,
  });
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const posts = await getBlogPosts();

  return (
    <>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("media"), href: "/media" },
          { label: t("pageTitle") },
        ]}
      />
      <section className="py-12 md:py-16">
        <Container>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-surface-secondary animate-pulse h-80" />
                ))}
              </div>
            }
          >
            <BlogGrid posts={posts} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
