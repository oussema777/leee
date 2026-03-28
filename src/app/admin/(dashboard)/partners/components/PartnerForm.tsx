"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";

interface PartnerData {
  id?: string;
  nameEn: string; nameAr: string;
  logoUrl: string;
  websiteUrl: string;
  type: string;
  order: number; isActive: boolean;
}

const empty: PartnerData = {
  nameEn: "", nameAr: "", logoUrl: "", websiteUrl: "", type: "PARTNER", order: 0, isActive: true,
};

export default function PartnerForm({ initial }: { initial?: PartnerData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<PartnerData>(initial || empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof PartnerData>(key: K, value: PartnerData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn || !form.logoUrl) { toast.error("Name and logo are required"); return; }
    setLoading(true);
    try {
      if (form.id) { await adminPut(`/partners/${form.id}`, form); toast.success("Updated"); }
      else { await adminPost("/partners", form); toast.success("Created"); }
      router.push("/admin/partners");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <AdminFormPage title={form.id ? "Edit Partner" : "New Partner"} backHref="/admin/partners" onSubmit={handleSubmit} loading={loading}>
      <AdminFormField type="select" label="Partner Type" value={form.type} onChange={(v) => set("type", v)}
        options={[
          { label: "Partner", value: "PARTNER" }, { label: "Client", value: "CLIENT" },
          { label: "Donor", value: "DONOR" }, { label: "Crisis Partner", value: "CRISIS_PARTNER" },
        ]} />
      <BilingualTabs>
        {(lang) => (
          <AdminFormField type="text" label={`Name (${lang.toUpperCase()})`} value={lang === "en" ? form.nameEn : form.nameAr} onChange={(v) => set(lang === "en" ? "nameEn" : "nameAr", v)} required={lang === "en"} />
        )}
      </BilingualTabs>
      <ImageUploader value={form.logoUrl} onChange={(url) => set("logoUrl", url)} onRemove={() => set("logoUrl", "")} folder="partners" label="Logo" />
      <AdminFormField type="url" label="Website URL" value={form.websiteUrl} onChange={(v) => set("websiteUrl", v)} />
      <AdminFormField type="number" label="Order" value={form.order} onChange={(v) => set("order", parseInt(v) || 0)} />
      <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
    </AdminFormPage>
  );
}
