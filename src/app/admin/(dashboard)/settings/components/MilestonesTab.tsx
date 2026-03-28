"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import AdminFormField from "../../../components/AdminFormField";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPut } from "@/lib/admin-api";

interface Milestone {
  year: number;
  titleEn: string; titleAr: string;
  descriptionEn: string; descriptionAr: string;
}

export default function MilestonesTab() {
  const toast = useToast();
  const [items, setItems] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGet<Milestone[]>("/settings/milestones").then(setItems).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  }, [toast]);

  const update = (i: number, field: keyof Milestone, val: any) => {
    const arr = [...items]; arr[i] = { ...arr[i], [field]: val }; setItems(arr);
  };
  const add = () => setItems([...items, { year: new Date().getFullYear(), titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "" }]);
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try { await adminPut("/settings/milestones", items); toast.success("Saved"); }
    catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Success Milestones</h3>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"><Plus size={16} /> Add</button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="p-4 bg-[#0f172a] rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue font-bold text-sm">
                {item.year}
              </div>
              <span className="text-sm font-medium text-gray-300">Milestone {i + 1}</span>
            </div>
            <button type="button" onClick={() => remove(i)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
          </div>
          <AdminFormField type="number" label="Year" value={item.year} onChange={(v) => update(i, "year", parseInt(v) || 0)} />
          <div className="grid grid-cols-2 gap-3">
            <AdminFormField type="text" label="Title (EN)" value={item.titleEn} onChange={(v) => update(i, "titleEn", v)} />
            <AdminFormField type="text" label="Title (AR)" value={item.titleAr} onChange={(v) => update(i, "titleAr", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminFormField type="textarea" label="Description (EN)" value={item.descriptionEn} onChange={(v) => update(i, "descriptionEn", v)} rows={3} />
            <AdminFormField type="textarea" label="Description (AR)" value={item.descriptionAr} onChange={(v) => update(i, "descriptionAr", v)} rows={3} />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-gray-500 text-sm">No milestones added.</p>}
      <button onClick={save} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-xl transition-colors disabled:opacity-50">
        {saving && <Loader2 size={16} className="animate-spin" />} {saving ? "Saving..." : "Save All"}
      </button>
    </div>
  );
}
