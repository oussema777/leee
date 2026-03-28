import { notFound } from "next/navigation";
import { demoPosts } from "@/components/sections/blog/blogData";
import { BlogPostPage } from "@/components/sections/blog/BlogPost";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = demoPosts.find((p) => p.slug === slug);
  if (!post) return {};

  const isAr = locale === "ar";
  return {
    title: isAr ? post.titleAr : post.titleEn,
    description: isAr ? post.excerptAr : post.excerptEn,
  };
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

  return <BlogPostPage post={post} />;
}
