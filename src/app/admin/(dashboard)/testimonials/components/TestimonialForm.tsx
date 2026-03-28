"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";

interface TestimonialData {
  id?: string;
  nameEn: string; nameAr: string;
  titleEn: string; titleAr: string;
  quoteEn: string; quoteAr: string;
  imageUrl: string;
  order: number; isActive: boolean;
}

const empty: TestimonialData = {
  nameEn: "", nameAr: "", titleEn: "", titleAr: "",
  quoteEn: "", quoteAr: "", imageUrl: "", order: 0, isActive: true,
};

export default function TestimonialForm({ initial }: { initial?: TestimonialData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<TestimonialData>(initial || empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof TestimonialData>(key: K, value: TestimonialData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn || !form.quoteEn) { toast.error("Name and quote (EN) are required"); return; }
    setLoading(true);
    try {
      if (form.id) { await adminPut(`/testimonials/${form.id}`, form); toast.success("Updated"); }
      else { await adminPost("/testimonials", form); toast.success("Created"); }
      router.push("/admin/testimonials");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <AdminFormPage title={form.id ? "Edit Testimonial" : "New Testimonial"} backHref="/admin/testimonials" onSubmit={handleSubmit} loading={loading}>
      <BilingualTabs>
        {(lang) => (
          <div className="space-y-4">
            <AdminFormField type="text" label={`Name (${lang.toUpperCase()})`} value={lang === "en" ? form.nameEn : form.nameAr} onChange={(v) => set(lang === "en" ? "nameEn" : "nameAr", v)} required={lang === "en"} />
            <AdminFormField type="text" label={`Title (${lang.toUpperCase()})`} value={lang === "en" ? form.titleEn : form.titleAr} onChange={(v) => set(lang === "en" ? "titleEn" : "titleAr", v)} />
            <AdminFormField type="textarea" label={`Quote (${lang.toUpperCase()})`} value={lang === "en" ? form.quoteEn : form.quoteAr} onChange={(v) => set(lang === "en" ? "quoteEn" : "quoteAr", v)} required={lang === "en"} rows={4} />
          </div>
        )}
      </BilingualTabs>
      <ImageUploader value={form.imageUrl} onChange={(url) => set("imageUrl", url)} onRemove={() => set("imageUrl", "")} folder="testimonials" label="Photo" />
      <AdminFormField type="number" label="Order" value={form.order} onChange={(v) => set("order", parseInt(v) || 0)} />
      <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
    </AdminFormPage>
  );
}
