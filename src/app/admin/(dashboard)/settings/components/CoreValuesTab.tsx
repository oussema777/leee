"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import AdminFormField from "../../../components/AdminFormField";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPut } from "@/lib/admin-api";

interface CoreValue {
  titleEn: string; titleAr: string;
  descriptionEn: string; descriptionAr: string;
  icon: string; isActive: boolean;
}

export default function CoreValuesTab() {
  const toast = useToast();
  const [items, setItems] = useState<CoreValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGet<CoreValue[]>("/settings/core-values").then(setItems).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  }, [toast]);

  const update = (i: number, field: keyof CoreValue, val: any) => {
    const arr = [...items]; arr[i] = { ...arr[i], [field]: val }; setItems(arr);
  };
  const add = () => setItems([...items, { titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "", icon: "", isActive: true }]);
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try { await adminPut("/settings/core-values", items); toast.success("Saved"); }
    catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Core Values</h3>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"><Plus size={16} /> Add</button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="p-4 bg-[#0f172a] rounded-xl space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-300">Value {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminFormField type="text" label="Title (EN)" value={item.titleEn} onChange={(v) => update(i, "titleEn", v)} />
            <AdminFormField type="text" label="Title (AR)" value={item.titleAr} onChange={(v) => update(i, "titleAr", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminFormField type="textarea" label="Description (EN)" value={item.descriptionEn} onChange={(v) => update(i, "descriptionEn", v)} rows={3} />
            <AdminFormField type="textarea" label="Description (AR)" value={item.descriptionAr} onChange={(v) => update(i, "descriptionAr", v)} rows={3} />
          </div>
          <AdminFormField type="text" label="Icon" value={item.icon} onChange={(v) => update(i, "icon", v)} placeholder="Lucide icon name" />
          <AdminFormField type="toggle" label="Active" value={item.isActive} onChange={(v) => update(i, "isActive", v)} />
        </div>
      ))}
      {items.length === 0 && <p className="text-gray-500 text-sm">No core values added.</p>}
      <button onClick={save} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-xl transition-colors disabled:opacity-50">
        {saving && <Loader2 size={16} className="animate-spin" />} {saving ? "Saving..." : "Save All"}
      </button>
    </div>
  );
}
