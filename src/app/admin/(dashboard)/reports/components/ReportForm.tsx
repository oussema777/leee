"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";

interface ReportData {
  id?: string;
  titleEn: string; titleAr: string;
  descriptionEn: string; descriptionAr: string;
  fileUrl: string;
  coverImageUrl: string;
  year: number;
  isActive: boolean;
}

const empty: ReportData = {
  titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "",
  fileUrl: "", coverImageUrl: "", year: new Date().getFullYear(), isActive: true,
};

export default function ReportForm({ initial }: { initial?: ReportData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<ReportData>(initial || empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof ReportData>(key: K, value: ReportData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn || !form.fileUrl) { toast.error("Title and file URL are required"); return; }
    setLoading(true);
    try {
      if (form.id) { await adminPut(`/reports/${form.id}`, form); toast.success("Updated"); }
      else { await adminPost("/reports", form); toast.success("Created"); }
      router.push("/admin/reports");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <AdminFormPage title={form.id ? "Edit Report" : "New Report"} backHref="/admin/reports" onSubmit={handleSubmit} loading={loading}>
      <BilingualTabs>
        {(lang) => (
          <div className="space-y-4">
            <AdminFormField type="text" label={`Title (${lang.toUpperCase()})`}
              value={lang === "en" ? form.titleEn : form.titleAr}
              onChange={(v) => set(lang === "en" ? "titleEn" : "titleAr", v)} required={lang === "en"} />
            <AdminFormField type="textarea" label={`Description (${lang.toUpperCase()})`}
              value={lang === "en" ? form.descriptionEn : form.descriptionAr}
              onChange={(v) => set(lang === "en" ? "descriptionEn" : "descriptionAr", v)} rows={4} />
          </div>
        )}
      </BilingualTabs>
      <ImageUploader value={form.fileUrl} onChange={(url) => set("fileUrl", url)} onRemove={() => set("fileUrl", "")} folder="reports" label="PDF File" accept="application/pdf" />
      <ImageUploader value={form.coverImageUrl} onChange={(url) => set("coverImageUrl", url)} onRemove={() => set("coverImageUrl", "")} folder="reports" label="Cover Image" />
      <AdminFormField type="number" label="Year" value={form.year} onChange={(v) => set("year", parseInt(v) || new Date().getFullYear())} />
      <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
    </AdminFormPage>
  );
}
