"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import { blogCategories } from "@/components/sections/blog/blogData";

interface BlogData {
  id?: string;
  slug: string;
  titleEn: string; titleAr: string;
  summaryEn: string; summaryAr: string;
  bodyEn: string; bodyAr: string;
  coverImageUrl: string;
  authorName: string;
  authorNameAr: string;
  authorRole: string;
  authorImageUrl: string;
  readTimeMin: string; // numeric string in the form
  isFeatured: boolean;
  category: string;
  isPublished: boolean;
  publishedAt: string;
}

const empty: BlogData = {
  slug: "", titleEn: "", titleAr: "", summaryEn: "", summaryAr: "",
  bodyEn: "", bodyAr: "", coverImageUrl: "", authorName: "", authorNameAr: "",
  authorRole: "", authorImageUrl: "", readTimeMin: "", isFeatured: false, category: "",
  isPublished: false, publishedAt: "",
};

const CATEGORIES = blogCategories.map((c) => ({ label: c.nameEn, value: c.slug }));

export default function BlogForm({ initial }: { initial?: Partial<BlogData> & { readTimeMin?: string | number | null } }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<BlogData>(initial ? {
    ...empty,
    ...initial,
    authorName: initial.authorName ?? "",
    authorNameAr: initial.authorNameAr ?? "",
    authorRole: initial.authorRole ?? "",
    authorImageUrl: initial.authorImageUrl ?? "",
    category: initial.category ?? "",
    coverImageUrl: initial.coverImageUrl ?? "",
    readTimeMin: initial.readTimeMin != null ? String(initial.readTimeMin) : "",
    isFeatured: initial.isFeatured ?? false,
    isPublished: initial.isPublished ?? false,
    publishedAt: initial.publishedAt ? new Date(initial.publishedAt).toISOString().split("T")[0] : "",
  } : empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof BlogData>(key: K, value: BlogData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleTitleChange = (value: string) => {
    set("titleEn", value);
    if (!form.id) set("slug", slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn || !form.summaryEn || !form.bodyEn) { toast.error("Title, summary, and body (EN) are required"); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        readTimeMin: form.readTimeMin.trim() ? Number(form.readTimeMin) : null,
        publishedAt: form.isPublished && form.publishedAt ? new Date(form.publishedAt).toISOString() : form.isPublished ? new Date().toISOString() : null,
      };
      if (form.id) { await adminPut(`/blog/${form.id}`, payload); toast.success("Updated"); }
      else { await adminPost("/blog", payload); toast.success("Created"); }
      router.push("/admin/blog");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <AdminFormPage title={form.id ? "Edit Blog Post" : "New Blog Post"} backHref="/admin/blog" onSubmit={handleSubmit} loading={loading}>
      <BilingualTabs>
        {(lang) => (
          <div className="space-y-4">
            <AdminFormField type="text" label={`Title (${lang.toUpperCase()})`}
              value={lang === "en" ? form.titleEn : form.titleAr}
              onChange={(v) => lang === "en" ? handleTitleChange(v) : set("titleAr", v)}
              required={lang === "en"} />
            <AdminFormField type="textarea" label={`Summary (${lang.toUpperCase()})`}
              value={lang === "en" ? form.summaryEn : form.summaryAr}
              onChange={(v) => set(lang === "en" ? "summaryEn" : "summaryAr", v)}
              required={lang === "en"} rows={3} />
            <AdminFormField type="textarea" label={`Body (${lang.toUpperCase()})`}
              value={lang === "en" ? form.bodyEn : form.bodyAr}
              onChange={(v) => set(lang === "en" ? "bodyEn" : "bodyAr", v)}
              required={lang === "en"} rows={10} />
          </div>
        )}
      </BilingualTabs>
      <AdminFormField type="text" label="Slug" value={form.slug} onChange={(v) => set("slug", v)} required />
      <ImageUploader value={form.coverImageUrl} onChange={(url) => set("coverImageUrl", url)} onRemove={() => set("coverImageUrl", "")} folder="blog" label="Cover Image" />
      <div className="grid grid-cols-2 gap-4">
        <AdminFormField type="text" label="Author Name (EN)" value={form.authorName} onChange={(v) => set("authorName", v)} />
        <AdminFormField type="text" label="Author Name (AR)" value={form.authorNameAr} onChange={(v) => set("authorNameAr", v)} />
      </div>
      <AdminFormField type="text" label="Author Role" value={form.authorRole} onChange={(v) => set("authorRole", v)} />
      <ImageUploader value={form.authorImageUrl} onChange={(url) => set("authorImageUrl", url)} onRemove={() => set("authorImageUrl", "")} folder="blog" label="Author Image" />
      <div className="grid grid-cols-2 gap-4">
        <AdminFormField type="select" label="Category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
        <AdminFormField type="number" label="Read Time (min)" value={form.readTimeMin} onChange={(v) => set("readTimeMin", v)} />
      </div>
      <AdminFormField type="toggle" label="Featured" value={form.isFeatured} onChange={(v) => set("isFeatured", v)} description="Featured posts are highlighted at the top of the blog" />
      <AdminFormField type="toggle" label="Published" value={form.isPublished} onChange={(v) => set("isPublished", v)} description="Published posts are visible on the website" />
      {form.isPublished && (
        <AdminFormField type="date" label="Published At" value={form.publishedAt} onChange={(v) => set("publishedAt", v)} />
      )}
    </AdminFormPage>
  );
}
