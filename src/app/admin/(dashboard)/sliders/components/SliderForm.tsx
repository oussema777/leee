"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";

interface SliderData {
  id?: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaLabelEn: string;
  ctaLabelAr: string;
  ctaUrl: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
}

const empty: SliderData = {
  titleEn: "", titleAr: "", subtitleEn: "", subtitleAr: "",
  ctaLabelEn: "", ctaLabelAr: "", ctaUrl: "", imageUrl: "",
  order: 0, isActive: true,
};

export default function SliderForm({ initial }: { initial?: SliderData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<SliderData>(initial || empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof SliderData>(key: K, value: SliderData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn || !form.imageUrl) {
      toast.error("Title (EN) and image are required");
      return;
    }
    setLoading(true);
    try {
      if (form.id) {
        await adminPut(`/sliders/${form.id}`, form);
        toast.success("Slider updated");
      } else {
        await adminPost("/sliders", form);
        toast.success("Slider created");
      }
      router.push("/admin/sliders");
    } catch {
      toast.error("Failed to save slider");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormPage
      title={form.id ? "Edit Slider" : "New Slider"}
      backHref="/admin/sliders"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <BilingualTabs>
        {(lang) => (
          <div className="space-y-4">
            <AdminFormField
              type="text"
              label={`Title (${lang.toUpperCase()})`}
              value={lang === "en" ? form.titleEn : form.titleAr}
              onChange={(v) => set(lang === "en" ? "titleEn" : "titleAr", v)}
              required={lang === "en"}
            />
            <AdminFormField
              type="text"
              label={`Subtitle (${lang.toUpperCase()})`}
              value={lang === "en" ? form.subtitleEn : form.subtitleAr}
              onChange={(v) => set(lang === "en" ? "subtitleEn" : "subtitleAr", v)}
            />
            <AdminFormField
              type="text"
              label={`CTA Label (${lang.toUpperCase()})`}
              value={lang === "en" ? form.ctaLabelEn : form.ctaLabelAr}
              onChange={(v) => set(lang === "en" ? "ctaLabelEn" : "ctaLabelAr", v)}
            />
          </div>
        )}
      </BilingualTabs>

      <AdminFormField
        type="url"
        label="CTA URL"
        value={form.ctaUrl}
        onChange={(v) => set("ctaUrl", v)}
        placeholder="https://..."
      />

      <ImageUploader
        value={form.imageUrl}
        onChange={(url) => set("imageUrl", url)}
        onRemove={() => set("imageUrl", "")}
        folder="sliders"
        label="Slider Image"
      />

      <div className="grid grid-cols-2 gap-4">
        <AdminFormField
          type="number"
          label="Order"
          value={form.order}
          onChange={(v) => set("order", parseInt(v) || 0)}
        />
      </div>

      <AdminFormField
        type="toggle"
        label="Active"
        value={form.isActive}
        onChange={(v) => set("isActive", v)}
        description="Only active sliders are shown on the website"
      />
    </AdminFormPage>
  );
}
