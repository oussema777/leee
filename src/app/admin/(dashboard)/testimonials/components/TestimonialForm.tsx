"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";

export interface TestimonialData {
  id?: string;
  nameEn: string; nameAr: string;
  titleEn: string; titleAr: string;
  quoteEn: string; quoteAr: string;
  imageUrl: string;
  programEn: string; programAr: string;
  category: string;
  year: number;
  isOriginalCard: boolean;
  order: number; isActive: boolean;
}

const empty: TestimonialData = {
  nameEn: "", nameAr: "", titleEn: "", titleAr: "",
  quoteEn: "", quoteAr: "", imageUrl: "",
  programEn: "", programAr: "", category: "entrepreneurs",
  year: new Date().getFullYear(), isOriginalCard: false,
  order: 0, isActive: true,
};

const CATEGORIES = [
  { label: "Entrepreneurs", value: "entrepreneurs" },
  { label: "Women Leaders", value: "women" },
  { label: "Community Members", value: "community" },
  { label: "Trusted By", value: "partners" },
];

export default function TestimonialForm({ initial, submissionId }: { initial?: TestimonialData; submissionId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<TestimonialData>(initial ? { ...empty, ...initial } : empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof TestimonialData>(key: K, value: TestimonialData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn.trim()) { toast.error("Name (EN) is required"); return; }
    if (form.isOriginalCard && !form.imageUrl) { toast.error("Upload the testimonial card image"); return; }
    if (!form.isOriginalCard && !form.quoteEn.trim()) { toast.error("Quote (EN) is required for text testimonials"); return; }
    setLoading(true);
    try {
      if (form.id) { await adminPut(`/testimonials/${form.id}`, form); toast.success("Updated"); }
      else { await adminPost("/testimonials", submissionId ? { ...form, submissionId } : form); toast.success("Created"); }
      router.push("/admin/testimonials");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <AdminFormPage title={form.id ? "Edit Testimonial" : "New Testimonial"} backHref="/admin/testimonials" onSubmit={handleSubmit} loading={loading}>
      <AdminFormField type="toggle" label="Use a designed testimonial image" value={form.isOriginalCard} onChange={(v) => set("isOriginalCard", v)} />
      <p className="text-sm text-gray-500">
        {form.isOriginalCard
          ? "Upload the complete card. Quote text is optional, but adding it makes the story accessible and readable in both languages. The full image is shown without cropping."
          : "Add the quote below. Text stories and uploaded cards share the same gallery size and style."}
      </p>
      <BilingualTabs>
        {(lang) => (
          <div className="space-y-4">
            <AdminFormField type="text" label={`Name (${lang.toUpperCase()})`} value={lang === "en" ? form.nameEn : form.nameAr} onChange={(v) => set(lang === "en" ? "nameEn" : "nameAr", v)} required={lang === "en"} />
            <AdminFormField type="text" label={`Title / Role (${lang.toUpperCase()})`} value={lang === "en" ? form.titleEn : form.titleAr} onChange={(v) => set(lang === "en" ? "titleEn" : "titleAr", v)} />
            <AdminFormField type="text" label={`Program (${lang.toUpperCase()})`} value={lang === "en" ? form.programEn : form.programAr} onChange={(v) => set(lang === "en" ? "programEn" : "programAr", v)} />
            <AdminFormField type="textarea" label={`${form.isOriginalCard ? "Quote / transcript (optional)" : "Quote"} (${lang.toUpperCase()})`} value={lang === "en" ? form.quoteEn : form.quoteAr} onChange={(v) => set(lang === "en" ? "quoteEn" : "quoteAr", v)} required={lang === "en" && !form.isOriginalCard} rows={4} />
          </div>
        )}
      </BilingualTabs>
      <ImageUploader value={form.imageUrl} onChange={(url) => set("imageUrl", url)} onRemove={() => set("imageUrl", "")} folder="testimonials" label={form.isOriginalCard ? "Testimonial card image" : "Photo"} />
      <AdminFormField type="select" label="Category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
      <div className="grid grid-cols-2 gap-4">
        <AdminFormField type="number" label="Year" value={form.year} onChange={(v) => set("year", parseInt(v) || 0)} />
        <AdminFormField type="number" label="Order" value={form.order} onChange={(v) => set("order", parseInt(v) || 0)} />
      </div>
      <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
    </AdminFormPage>
  );
}
