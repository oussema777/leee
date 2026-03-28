"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";

interface VideoData {
  id?: string;
  titleEn: string; titleAr: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  order: number; isActive: boolean;
}

const empty: VideoData = {
  titleEn: "", titleAr: "", youtubeUrl: "", thumbnailUrl: "", order: 0, isActive: true,
};

export default function VideoForm({ initial }: { initial?: VideoData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<VideoData>(initial || empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof VideoData>(key: K, value: VideoData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn || !form.youtubeUrl) { toast.error("Title and YouTube URL are required"); return; }
    setLoading(true);
    try {
      if (form.id) { await adminPut(`/videos/${form.id}`, form); toast.success("Updated"); }
      else { await adminPost("/videos", form); toast.success("Created"); }
      router.push("/admin/videos");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <AdminFormPage title={form.id ? "Edit Video" : "New Video"} backHref="/admin/videos" onSubmit={handleSubmit} loading={loading}>
      <BilingualTabs>
        {(lang) => (
          <AdminFormField type="text" label={`Title (${lang.toUpperCase()})`} value={lang === "en" ? form.titleEn : form.titleAr} onChange={(v) => set(lang === "en" ? "titleEn" : "titleAr", v)} required={lang === "en"} />
        )}
      </BilingualTabs>
      <AdminFormField type="url" label="YouTube URL" value={form.youtubeUrl} onChange={(v) => set("youtubeUrl", v)} required placeholder="https://youtube.com/watch?v=..." />
      <AdminFormField type="url" label="Thumbnail URL (optional)" value={form.thumbnailUrl} onChange={(v) => set("thumbnailUrl", v)} placeholder="Leave empty to use YouTube thumbnail" />
      <AdminFormField type="number" label="Order" value={form.order} onChange={(v) => set("order", parseInt(v) || 0)} />
      <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
    </AdminFormPage>
  );
}
