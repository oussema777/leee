"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";

interface MemberData {
  id?: string;
  nameEn: string; nameAr: string;
  titleEn: string; titleAr: string;
  bioEn: string; bioAr: string;
  imageUrl: string;
  linkedinUrl: string;
  memberType: string;
  order: number; isActive: boolean;
}

const empty: MemberData = {
  nameEn: "", nameAr: "", titleEn: "", titleAr: "", bioEn: "", bioAr: "",
  imageUrl: "", linkedinUrl: "", memberType: "TEAM", order: 0, isActive: true,
};

export default function MemberForm({ initial }: { initial?: MemberData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<MemberData>(initial || empty);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof MemberData>(key: K, value: MemberData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn || !form.titleEn) { toast.error("Name and title are required"); return; }
    setLoading(true);
    try {
      if (form.id) { await adminPut(`/members/${form.id}`, form); toast.success("Updated"); }
      else { await adminPost("/members", form); toast.success("Created"); }
      router.push("/admin/members");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <AdminFormPage title={form.id ? "Edit Member" : "New Member"} backHref="/admin/members" onSubmit={handleSubmit} loading={loading}>
      <AdminFormField type="select" label="Member Type" value={form.memberType} onChange={(v) => set("memberType", v)}
        options={[{ label: "Board Member", value: "BOARD" }, { label: "Team Member", value: "TEAM" }]} />
      <BilingualTabs>
        {(lang) => (
          <div className="space-y-4">
            <AdminFormField type="text" label={`Name (${lang.toUpperCase()})`} value={lang === "en" ? form.nameEn : form.nameAr} onChange={(v) => set(lang === "en" ? "nameEn" : "nameAr", v)} required={lang === "en"} />
            <AdminFormField type="text" label={`Title (${lang.toUpperCase()})`} value={lang === "en" ? form.titleEn : form.titleAr} onChange={(v) => set(lang === "en" ? "titleEn" : "titleAr", v)} required={lang === "en"} />
            <AdminFormField type="textarea" label={`Bio (${lang.toUpperCase()})`} value={lang === "en" ? form.bioEn : form.bioAr} onChange={(v) => set(lang === "en" ? "bioEn" : "bioAr", v)} rows={4} />
          </div>
        )}
      </BilingualTabs>
      <ImageUploader value={form.imageUrl} onChange={(url) => set("imageUrl", url)} onRemove={() => set("imageUrl", "")} folder="members" label="Photo" />
      <AdminFormField type="url" label="LinkedIn URL" value={form.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} />
      <AdminFormField type="number" label="Order" value={form.order} onChange={(v) => set("order", parseInt(v) || 0)} />
      <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
    </AdminFormPage>
  );
}
