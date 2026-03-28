"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";

interface GalleryData {
  id?: string;
  imageUrl: string;
  captionEn: string; captionAr: string;
  albumName: string; albumNameAr: string;
  order: number; isActive: boolean;
}

const empty: GalleryData = {
  imageUrl: "", captionEn: "", captionAr: "", albumName: "", albumNameAr: "", order: 0, isActive: true,
};

export default function GalleryForm({ initial }: { initial?: GalleryData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<GalleryData>(initial || empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof GalleryData>(key: K, value: GalleryData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) { toast.error("Image is required"); return; }
    setLoading(true);
    try {
      if (form.id) { await adminPut(`/gallery/${form.id}`, form); toast.success("Updated"); }
      else { await adminPost("/gallery", form); toast.success("Created"); }
      router.push("/admin/gallery");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <AdminFormPage title={form.id ? "Edit Image" : "New Image"} backHref="/admin/gallery" onSubmit={handleSubmit} loading={loading}>
      <ImageUploader value={form.imageUrl} onChange={(url) => set("imageUrl", url)} onRemove={() => set("imageUrl", "")} folder="gallery" label="Image" />
      <BilingualTabs>
        {(lang) => (
          <div className="space-y-4">
            <AdminFormField type="text" label={`Caption (${lang.toUpperCase()})`} value={lang === "en" ? form.captionEn : form.captionAr} onChange={(v) => set(lang === "en" ? "captionEn" : "captionAr", v)} />
            <AdminFormField type="text" label={`Album Name (${lang.toUpperCase()})`} value={lang === "en" ? form.albumName : form.albumNameAr} onChange={(v) => set(lang === "en" ? "albumName" : "albumNameAr", v)} />
          </div>
        )}
      </BilingualTabs>
      <AdminFormField type="number" label="Order" value={form.order} onChange={(v) => set("order", parseInt(v) || 0)} />
      <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
    </AdminFormPage>
  );
}
