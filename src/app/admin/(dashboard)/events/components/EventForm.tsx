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
  descriptionEn: string; descriptionAr: string;
  imageUrl: string;
  location: string;
  startDate: string; endDate: string;
  registrationUrl: string;
  isActive: boolean; isFeatured: boolean;
}

const empty: EventData = {
  slug: "", titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "",
  imageUrl: "", location: "", startDate: "", endDate: "", registrationUrl: "",
  isActive: true, isFeatured: false,
};

export default function EventForm({ initial }: { initial?: EventData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<EventData>(initial ? {
    ...initial,
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
            <AdminFormField type="textarea" label={`Description (${lang.toUpperCase()})`}
              value={lang === "en" ? form.descriptionEn : form.descriptionAr}
              onChange={(v) => set(lang === "en" ? "descriptionEn" : "descriptionAr", v)}
              required={lang === "en"} rows={6} />
          </div>
        )}
      </BilingualTabs>
      <AdminFormField type="text" label="Slug" value={form.slug} onChange={(v) => set("slug", v)} required />
      <ImageUploader value={form.imageUrl} onChange={(url) => set("imageUrl", url)} onRemove={() => set("imageUrl", "")} folder="events" />
      <div className="grid grid-cols-2 gap-4">
        <AdminFormField type="date" label="Start Date" value={form.startDate} onChange={(v) => set("startDate", v)} required />
        <AdminFormField type="date" label="End Date" value={form.endDate} onChange={(v) => set("endDate", v)} />
      </div>
      <AdminFormField type="text" label="Location" value={form.location} onChange={(v) => set("location", v)} />
      <AdminFormField type="url" label="Registration URL" value={form.registrationUrl} onChange={(v) => set("registrationUrl", v)} />
      <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
      <AdminFormField type="toggle" label="Featured" value={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
    </AdminFormPage>
  );
}
