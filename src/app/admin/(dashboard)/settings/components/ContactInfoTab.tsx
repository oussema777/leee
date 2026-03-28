"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import AdminFormField from "../../../components/AdminFormField";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPut } from "@/lib/admin-api";

interface ContactItem { key: string; valueEn: string; valueAr?: string | null; }

const defaultKeys = ["email", "phone", "address", "facebook", "instagram", "twitter", "linkedin", "youtube"];

export default function ContactInfoTab() {
  const toast = useToast();
  const [items, setItems] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGet<ContactItem[]>("/settings/contact-info")
      .then((data) => setItems(data.length ? data : defaultKeys.map((k) => ({ key: k, valueEn: "", valueAr: "" }))))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [toast]);

  const update = (i: number, field: keyof ContactItem, val: string) => {
    const arr = [...items]; arr[i] = { ...arr[i], [field]: val }; setItems(arr);
  };

  const addItem = () => setItems([...items, { key: "", valueEn: "", valueAr: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      await adminPut("/settings/contact-info", items.filter((i) => i.key && i.valueEn));
      toast.success("Contact info saved");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Contact Information</h3>
        <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline">
          <Plus size={16} /> Add Field
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start p-4 bg-[#0f172a] rounded-xl">
          <div className="flex-1 space-y-3">
            <AdminFormField type="text" label="Key" value={item.key} onChange={(v) => update(i, "key", v)} placeholder="e.g. email, phone" />
            <AdminFormField type="text" label="Value (EN)" value={item.valueEn} onChange={(v) => update(i, "valueEn", v)} />
            <AdminFormField type="text" label="Value (AR)" value={item.valueAr || ""} onChange={(v) => update(i, "valueAr", v)} />
          </div>
          <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-400 hover:text-red-300 mt-6"><Trash2 size={16} /></button>
        </div>
      ))}
      <button onClick={save} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-xl transition-colors disabled:opacity-50">
        {saving && <Loader2 size={16} className="animate-spin" />} {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
