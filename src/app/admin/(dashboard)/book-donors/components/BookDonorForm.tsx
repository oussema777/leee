"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";

export interface DonorFormData { id?: string; type: "INDIVIDUAL" | "ORGANISATION"; displayName: string; contactName: string; phone: string; email: string; logoUrl: string; logoApproved: boolean; publicRecognition: boolean; active: boolean; adminNotes: string; }
const empty: DonorFormData = { type: "INDIVIDUAL", displayName: "", contactName: "", phone: "", email: "", logoUrl: "", logoApproved: false, publicRecognition: false, active: true, adminNotes: "" };

export default function BookDonorForm({ initial }: { initial?: Partial<DonorFormData> }) {
  const router = useRouter(); const toast = useToast();
  const [form, setForm] = useState<DonorFormData>({ ...empty, ...initial }); const [loading, setLoading] = useState(false);
  const set = <K extends keyof DonorFormData>(key: K, value: DonorFormData[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); try {
    if (form.id) await adminPut(`/book-donors/${form.id}`, form); else await adminPost("/book-donors", form);
    toast.success(form.id ? "Donor updated" : "Donor created"); router.push("/admin/book-donors");
  } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to save donor"); } finally { setLoading(false); } };
  return <AdminFormPage title={form.id ? "Edit Donor" : "New Donor"} backHref="/admin/book-donors" onSubmit={submit} loading={loading}>
    <div className="grid gap-5 md:grid-cols-2">
      <AdminFormField type="select" label="Donor type" value={form.type} onChange={(value) => set("type", value as DonorFormData["type"])} options={[{ value: "INDIVIDUAL", label: "Individual" }, { value: "ORGANISATION", label: "Organisation" }]} required />
      <AdminFormField type="text" label={form.type === "ORGANISATION" ? "Organisation name (optional)" : "Full name (optional)"} value={form.displayName} onChange={(value) => set("displayName", value)} />
      {form.type === "ORGANISATION" && <AdminFormField type="text" label="Contact person (optional)" value={form.contactName} onChange={(value) => set("contactName", value)} />}
      <AdminFormField type="text" label="Phone / WhatsApp (optional)" value={form.phone} onChange={(value) => set("phone", value)} />
      <AdminFormField type="email" label="Email (optional)" value={form.email} onChange={(value) => set("email", value)} />
    </div>
    {form.type === "ORGANISATION" && <><ImageUploader value={form.logoUrl} onChange={(value) => set("logoUrl", value)} onRemove={() => { set("logoUrl", ""); set("logoApproved", false); }} folder="book-donors" label="Organisation logo (optional)" /><AdminFormField type="toggle" label="Logo approved for public display" value={form.logoApproved} onChange={(value) => set("logoApproved", value)} description="Approve only after confirming this logo belongs to the organisation." /></>}
    <AdminFormField type="toggle" label="Public recognition" value={form.publicRecognition} onChange={(value) => set("publicRecognition", value)} description="Show this donor's name with donated books. Contact details always remain private." />
    <AdminFormField type="toggle" label="Active donor" value={form.active} onChange={(value) => set("active", value)} description="Inactive donors remain attached to historical records but are hidden from the book picker." />
    <AdminFormField type="textarea" label="Internal notes (optional)" value={form.adminNotes} onChange={(value) => set("adminNotes", value)} rows={4} />
  </AdminFormPage>;
}
