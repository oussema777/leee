import { db } from "@/lib/db";
import type { BlogPost } from "@prisma/client";

export type BlogPostListItem = {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  coverImageUrl: string;
  authorNameEn: string;
  authorNameAr: string;
  authorRole: string;
  authorImageUrl: string;
  categorySlug: string;
  publishedAt: string;
  readTimeMin: number;
  isFeatured: boolean;
};

export type BlogPostDetail = BlogPostListItem & {
  contentEn: string;
  contentAr: string;
};

function toListItem(p: BlogPost): BlogPostListItem {
  return {
    id: p.id,
    slug: p.slug,
    titleEn: p.titleEn,
    titleAr: p.titleAr,
    excerptEn: p.summaryEn ?? "",
    excerptAr: p.summaryAr ?? "",
    coverImageUrl: p.coverImageUrl ?? "",
    authorNameEn: p.authorName ?? "",
    authorNameAr: p.authorNameAr ?? "",
    authorRole: p.authorRole ?? "",
    authorImageUrl: p.authorImageUrl ?? "",
    categorySlug: p.category ?? "",
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
    readTimeMin: p.readTimeMin ?? 0,
    isFeatured: p.isFeatured,
  };
}

export async function getBlogPosts(): Promise<BlogPostListItem[]> {
  const posts = await db.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });
  return posts.map(toListItem);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const p = await db.blogPost.findUnique({ where: { slug } });
  if (!p || !p.isPublished) return null;
  return {
    ...toListItem(p),
    contentEn: p.bodyEn,
    contentAr: p.bodyAr,
  };
}

export async function getRelatedBlogPosts(
  currentSlug: string,
  categorySlug: string,
  limit = 3
): Promise<BlogPostListItem[]> {
  const posts = await db.blogPost.findMany({
    where: { isPublished: true, slug: { not: currentSlug } },
    orderBy: { publishedAt: "desc" },
  });
  const mapped = posts.map(toListItem);
  const same = mapped.filter((p) => categorySlug && p.categorySlug === categorySlug);
  const others = mapped.filter((p) => !categorySlug || p.categorySlug !== categorySlug);
  return [...same, ...others].slice(0, limit);
}
