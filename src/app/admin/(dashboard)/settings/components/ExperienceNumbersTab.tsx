"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import AdminFormField from "../../../components/AdminFormField";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPut } from "@/lib/admin-api";

interface ExpNum { labelEn: string; labelAr: string; value: number; suffix: string; icon: string; isActive: boolean; }

export default function ExperienceNumbersTab() {
  const toast = useToast();
  const [items, setItems] = useState<ExpNum[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGet<ExpNum[]>("/settings/experience-numbers").then(setItems).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  }, [toast]);

  const update = (i: number, field: keyof ExpNum, val: any) => {
    const arr = [...items]; arr[i] = { ...arr[i], [field]: val }; setItems(arr);
  };
  const add = () => setItems([...items, { labelEn: "", labelAr: "", value: 0, suffix: "", icon: "", isActive: true }]);
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try { await adminPut("/settings/experience-numbers", items); toast.success("Saved"); }
    catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Experience Numbers</h3>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"><Plus size={16} /> Add</button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="p-4 bg-[#0f172a] rounded-xl space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-300">Number {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminFormField type="text" label="Label (EN)" value={item.labelEn} onChange={(v) => update(i, "labelEn", v)} />
            <AdminFormField type="text" label="Label (AR)" value={item.labelAr} onChange={(v) => update(i, "labelAr", v)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <AdminFormField type="number" label="Value" value={item.value} onChange={(v) => update(i, "value", parseInt(v) || 0)} />
            <AdminFormField type="text" label="Suffix" value={item.suffix} onChange={(v) => update(i, "suffix", v)} placeholder="e.g. +, %" />
            <AdminFormField type="text" label="Icon" value={item.icon} onChange={(v) => update(i, "icon", v)} />
          </div>
          <AdminFormField type="toggle" label="Active" value={item.isActive} onChange={(v) => update(i, "isActive", v)} />
        </div>
      ))}
      {items.length === 0 && <p className="text-gray-500 text-sm">No experience numbers added.</p>}
      <button onClick={save} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-xl transition-colors disabled:opacity-50">
        {saving && <Loader2 size={16} className="animate-spin" />} {saving ? "Saving..." : "Save All"}
      </button>
    </div>
  );
}
