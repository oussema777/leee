"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import {
  ChevronRight,
  Clock,
  Calendar,
  ArrowLeft,
  Share2,
  Link2,
} from "lucide-react";
import { blogCategories, demoPosts } from "./blogData";
import type { BlogPost as BlogPostType } from "./blogData";

function RelatedPosts({ currentSlug, categorySlug, isAr }: { currentSlug: string; categorySlug: string; isAr: boolean }) {
  const sameCategory = demoPosts.filter((p) => p.slug !== currentSlug && p.categorySlug === categorySlug);
  const others = demoPosts.filter((p) => p.slug !== currentSlug && p.categorySlug !== categorySlug);
  const related = [...sameCategory, ...others].slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="border-t border-gray-100 py-12">
      <Container>
        <h2 className="text-xl font-bold text-text-primary mb-6">
          {isAr ? "مقالات ذات صلة" : "Related Articles"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map((post) => {
            const date = new Date(post.publishedAt);
            const dateStr = date.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <Link
                key={post.id}
                href={`/media/blog/${post.slug}`}
                className="group flex gap-4 items-start"
              >
                <div className="w-20 h-20 shrink-0 overflow-hidden bg-gray-100 relative">
                  <Image
                    src={post.coverImageUrl}
                    alt={isAr ? post.titleAr : post.titleEn}
                    fill
                    sizes="80px"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-muted mb-1">{dateStr}</p>
                  <h3 className="text-sm font-semibold text-text-primary line-clamp-2 group-hover:text-brand-blue transition-colors">
                    {isAr ? post.titleAr : post.titleEn}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function BlogPostPage({ post }: { post: BlogPostType }) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const date = new Date(post.publishedAt);
  const dateStr = date.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const catLabel = blogCategories.find((c) => c.slug === post.categorySlug);
  const content = isAr ? post.contentAr : post.contentEn;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  // Parse markdown-like content into paragraphs and headings
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={i} className="text-xl font-bold text-text-primary mt-8 mb-4">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }

      if (trimmed.startsWith("- **")) {
        const match = trimmed.match(/^- \*\*(.+?)\*\*[:\s—–-]*(.*)$/);
        if (match) {
          return (
            <li key={i} className="flex gap-2 mb-2 text-text-secondary text-[15px] leading-relaxed">
              <span className="text-brand-blue mt-1.5 shrink-0">•</span>
              <span><strong className="text-text-primary">{match[1]}</strong>{match[2] ? `: ${match[2]}` : ""}</span>
            </li>
          );
        }
      }

      if (trimmed.startsWith("- ")) {
        return (
          <li key={i} className="flex gap-2 mb-2 text-text-secondary text-[15px] leading-relaxed">
            <span className="text-brand-blue mt-1.5 shrink-0">•</span>
            <span>{trimmed.replace("- ", "")}</span>
          </li>
        );
      }

      if (/^\d+\.\s\*\*/.test(trimmed)) {
        const match = trimmed.match(/^\d+\.\s\*\*(.+?)\*\*\s*[—–-]*\s*(.*)$/);
        if (match) {
          return (
            <li key={i} className="flex gap-2 mb-2 text-text-secondary text-[15px] leading-relaxed">
              <span className="text-brand-blue font-bold shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
              <span><strong className="text-text-primary">{match[1]}</strong>{match[2] ? ` — ${match[2]}` : ""}</span>
            </li>
          );
        }
      }

      return (
        <p key={i} className="text-text-secondary text-[15px] leading-relaxed mb-4">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[380px] md:min-h-[440px] flex items-end">
        <Image
          src={post.coverImageUrl}
          alt={isAr ? post.titleAr : post.titleEn}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-deeper/95 via-brand-blue-deeper/60 to-black/30" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-32">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-5">
            <Link href="/" className="hover:text-white transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight className="w-3 h-3 rtl:rotate-180" />
            <Link href="/media/blog" className="hover:text-white transition-colors">
              {isAr ? "المدونة" : "Blog"}
            </Link>
            <ChevronRight className="w-3 h-3 rtl:rotate-180" />
            <span className="text-white/90 truncate max-w-[200px]">
              {isAr ? post.titleAr : post.titleEn}
            </span>
          </nav>

          <Badge variant="yellow">
            {isAr ? catLabel?.nameAr : catLabel?.nameEn}
          </Badge>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-3 mb-5 max-w-4xl leading-tight">
            {isAr ? post.titleAr : post.titleEn}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 relative">
                <Image src={post.authorImageUrl} alt="" fill sizes="32px" className="object-cover" />
              </div>
              <span className="font-medium text-white/90">
                {isAr ? post.authorNameAr : post.authorNameEn}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{post.readTimeMin} {isAr ? "دقائق للقراءة" : "min read"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-14">
        <Container>
          <div className="max-w-3xl mx-auto">
            {/* Article body */}
            <article className="mb-10">
              {renderContent(content)}
            </article>

            {/* Share + Back */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <Link
                href="/media/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:gap-2.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {isAr ? "العودة إلى المدونة" : "Back to Blog"}
              </Link>

              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5" />
                  {isAr ? "مشاركة" : "Share"}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="text-xs text-text-secondary hover:text-brand-blue transition-colors bg-gray-50 hover:bg-brand-blue-light px-3 py-1.5 flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" />
                  {isAr ? "نسخ" : "Copy"}
                </button>
              </div>
            </div>

            {/* Author card */}
            <div className="mt-10 bg-brand-blue-light/30 p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-brand-blue/20 relative">
                <Image src={post.authorImageUrl} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {isAr ? post.authorNameAr : post.authorNameEn}
                </p>
                <p className="text-xs text-text-muted">{post.authorRole}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Related */}
      <RelatedPosts currentSlug={post.slug} categorySlug={post.categorySlug} isAr={isAr} />
    </>
  );
}
