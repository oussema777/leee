import { notFound } from "next/navigation";
import { demoPosts } from "@/components/sections/blog/blogData";
import { BlogPostPage } from "@/components/sections/blog/BlogPost";
import { buildPageMetadata } from "@/lib/metadata";
import { JsonLd } from "@/components/shared/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = demoPosts.find((p) => p.slug === slug);
  if (!post) return {};

  const isAr = locale === "ar";
  return buildPageMetadata({
    title: isAr ? post.titleAr : post.titleEn,
    description: isAr ? post.excerptAr : post.excerptEn,
    path: `media/blog/${slug}`,
    locale,
    ogImage: post.coverImageUrl,
  });
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = demoPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.titleEn,
        description: post.excerptEn,
        image: post.coverImageUrl ? `https://theleeexperience.com${post.coverImageUrl}` : undefined,
        datePublished: post.publishedAt,
        author: { "@type": "Person", name: post.authorNameEn },
        publisher: { "@type": "Organization", name: "The LEE Experience", logo: { "@type": "ImageObject", url: "https://theleeexperience.com/LEEE-LOGO.png" } },
        url: `https://theleeexperience.com/en/media/blog/${post.slug}`,
      }} />
      <BlogPostPage post={post} />
    </>
  );
}
