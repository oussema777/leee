"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";

interface CareerData {
  id?: string;
  slug: string;
  titleEn: string; titleAr: string;
  descriptionEn: string; descriptionAr: string;
  locationEn: string; locationAr: string;
  type: string;
  deadline: string;
  isActive: boolean;
}

const empty: CareerData = {
  slug: "", titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "",
  locationEn: "", locationAr: "", type: "FULL_TIME", deadline: "", isActive: true,
};

export default function CareerForm({ initial }: { initial?: CareerData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<CareerData>(initial ? {
    ...initial,
    deadline: initial.deadline ? new Date(initial.deadline).toISOString().split("T")[0] : "",
  } : empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof CareerData>(key: K, value: CareerData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleTitleChange = (value: string) => {
    set("titleEn", value);
    if (!form.id) set("slug", slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn || !form.descriptionEn) { toast.error("Title and description are required"); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };
      if (form.id) { await adminPut(`/careers/${form.id}`, payload); toast.success("Updated"); }
      else { await adminPost("/careers", payload); toast.success("Created"); }
      router.push("/admin/careers");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <AdminFormPage title={form.id ? "Edit Position" : "New Position"} backHref="/admin/careers" onSubmit={handleSubmit} loading={loading}>
      <BilingualTabs>
        {(lang) => (
          <div className="space-y-4">
            <AdminFormField type="text" label={`Title (${lang.toUpperCase()})`}
              value={lang === "en" ? form.titleEn : form.titleAr}
              onChange={(v) => lang === "en" ? handleTitleChange(v) : set("titleAr", v)} required={lang === "en"} />
            <AdminFormField type="textarea" label={`Description (${lang.toUpperCase()})`}
              value={lang === "en" ? form.descriptionEn : form.descriptionAr}
              onChange={(v) => set(lang === "en" ? "descriptionEn" : "descriptionAr", v)} required={lang === "en"} rows={8} />
            <AdminFormField type="text" label={`Location (${lang.toUpperCase()})`}
              value={lang === "en" ? form.locationEn : form.locationAr}
              onChange={(v) => set(lang === "en" ? "locationEn" : "locationAr", v)} />
          </div>
        )}
      </BilingualTabs>
      <AdminFormField type="text" label="Slug" value={form.slug} onChange={(v) => set("slug", v)} required />
      <AdminFormField type="select" label="Job Type" value={form.type} onChange={(v) => set("type", v)}
        options={[
          { label: "Full Time", value: "FULL_TIME" }, { label: "Part Time", value: "PART_TIME" },
          { label: "Contract", value: "CONTRACT" }, { label: "Volunteer", value: "VOLUNTEER" },
          { label: "Internship", value: "INTERNSHIP" },
        ]} />
      <AdminFormField type="date" label="Application Deadline" value={form.deadline} onChange={(v) => set("deadline", v)} />
      <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
    </AdminFormPage>
  );
}
