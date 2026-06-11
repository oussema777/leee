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

interface EventData {
  id?: string;
  slug: string;
  titleEn: string; titleAr: string;
  summaryEn: string; summaryAr: string;
  descriptionEn: string; descriptionAr: string;
  imageUrl: string;
  location: string; locationAr: string;
  category: string;
  galleryImages: string; // newline-separated URLs in the form
  startDate: string; endDate: string;
  registrationUrl: string;
  isActive: boolean; isFeatured: boolean;
}

const empty: EventData = {
  slug: "", titleEn: "", titleAr: "", summaryEn: "", summaryAr: "",
  descriptionEn: "", descriptionAr: "",
  imageUrl: "", location: "", locationAr: "", category: "workshop", galleryImages: "",
  startDate: "", endDate: "", registrationUrl: "",
  isActive: true, isFeatured: false,
};

const CATEGORIES = [
  { label: "Workshop", value: "workshop" },
  { label: "Webinar", value: "webinar" },
  { label: "Conference", value: "conference" },
  { label: "Community", value: "community" },
  { label: "Training", value: "training" },
];

export default function EventForm({ initial }: { initial?: EventData & { galleryImages?: string[] | string } }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<EventData>(initial ? {
    ...initial,
    galleryImages: Array.isArray(initial.galleryImages) ? initial.galleryImages.join("\n") : (initial.galleryImages || ""),
    startDate: initial.startDate ? new Date(initial.startDate).toISOString().split("T")[0] : "",
    endDate: initial.endDate ? new Date(initial.endDate).toISOString().split("T")[0] : "",
  } : empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof EventData>(key: K, value: EventData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleTitleChange = (value: string) => {
    set("titleEn", value);
    if (!form.id) set("slug", slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn || !form.startDate) { toast.error("Title and start date are required"); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        galleryImages: form.galleryImages.split("\n").map((s) => s.trim()).filter(Boolean),
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      if (form.id) { await adminPut(`/events/${form.id}`, payload); toast.success("Updated"); }
      else { await adminPost("/events", payload); toast.success("Created"); }
      router.push("/admin/events");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <AdminFormPage title={form.id ? "Edit Event" : "New Event"} backHref="/admin/events" onSubmit={handleSubmit} loading={loading}>
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
              rows={2} />
            <AdminFormField type="textarea" label={`Description (${lang.toUpperCase()})`}
              value={lang === "en" ? form.descriptionEn : form.descriptionAr}
              onChange={(v) => set(lang === "en" ? "descriptionEn" : "descriptionAr", v)}
              required={lang === "en"} rows={6} />
          </div>
        )}
      </BilingualTabs>
      <AdminFormField type="text" label="Slug" value={form.slug} onChange={(v) => set("slug", v)} required />
      <AdminFormField type="select" label="Category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
      <ImageUploader value={form.imageUrl} onChange={(url) => set("imageUrl", url)} onRemove={() => set("imageUrl", "")} folder="events" />
      <div className="grid grid-cols-2 gap-4">
        <AdminFormField type="date" label="Start Date" value={form.startDate} onChange={(v) => set("startDate", v)} required />
        <AdminFormField type="date" label="End Date" value={form.endDate} onChange={(v) => set("endDate", v)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminFormField type="text" label="Location (EN)" value={form.location} onChange={(v) => set("location", v)} />
        <AdminFormField type="text" label="Location (AR)" value={form.locationAr} onChange={(v) => set("locationAr", v)} />
      </div>
      <AdminFormField type="url" label="Registration URL" value={form.registrationUrl} onChange={(v) => set("registrationUrl", v)} />
      <AdminFormField type="textarea" label="Gallery image URLs (one per line)" value={form.galleryImages} onChange={(v) => set("galleryImages", v)} rows={4} />
      <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
      <AdminFormField type="toggle" label="Featured" value={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
    </AdminFormPage>
  );
}
