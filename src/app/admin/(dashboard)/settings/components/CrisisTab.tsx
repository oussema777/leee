"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import AdminFormField from "../../../components/AdminFormField";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPut } from "@/lib/admin-api";

interface CrisisStat { labelEn: string; labelAr: string; value: string; icon: string; }
interface CrisisIntervention { titleEn: string; titleAr: string; descriptionEn: string; descriptionAr: string; icon: string; }
interface CrisisData { stats: CrisisStat[]; interventions: CrisisIntervention[]; }

export default function CrisisTab() {
  const toast = useToast();
  const [data, setData] = useState<CrisisData>({ stats: [], interventions: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGet<CrisisData>("/settings/crisis").then(setData).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  }, [toast]);

  const updateStat = (i: number, field: keyof CrisisStat, val: string) => {
    const arr = [...data.stats]; arr[i] = { ...arr[i], [field]: val }; setData({ ...data, stats: arr });
  };
  const addStat = () => setData({ ...data, stats: [...data.stats, { labelEn: "", labelAr: "", value: "", icon: "" }] });
  const removeStat = (i: number) => setData({ ...data, stats: data.stats.filter((_, idx) => idx !== i) });

  const updateIntervention = (i: number, field: keyof CrisisIntervention, val: string) => {
    const arr = [...data.interventions]; arr[i] = { ...arr[i], [field]: val }; setData({ ...data, interventions: arr });
  };
  const addIntervention = () => setData({ ...data, interventions: [...data.interventions, { titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "", icon: "" }] });
  const removeIntervention = (i: number) => setData({ ...data, interventions: data.interventions.filter((_, idx) => idx !== i) });

  const save = async () => {
    setSaving(true);
    try { await adminPut("/settings/crisis", data); toast.success("Saved"); }
    catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Crisis Statistics</h3>
          <button type="button" onClick={addStat} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"><Plus size={16} /> Add</button>
        </div>
        {data.stats.map((s, i) => (
          <div key={i} className="mb-3 p-4 bg-[#0f172a] rounded-xl space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Stat {i + 1}</span>
              <button type="button" onClick={() => removeStat(i)} className="p-1 text-red-400"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField type="text" label="Label (EN)" value={s.labelEn} onChange={(v) => updateStat(i, "labelEn", v)} />
              <AdminFormField type="text" label="Label (AR)" value={s.labelAr} onChange={(v) => updateStat(i, "labelAr", v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField type="text" label="Value" value={s.value} onChange={(v) => updateStat(i, "value", v)} />
              <AdminFormField type="text" label="Icon" value={s.icon} onChange={(v) => updateStat(i, "icon", v)} />
            </div>
          </div>
        ))}
      </div>

      {/* Interventions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Crisis Interventions</h3>
          <button type="button" onClick={addIntervention} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"><Plus size={16} /> Add</button>
        </div>
        {data.interventions.map((v, i) => (
          <div key={i} className="mb-3 p-4 bg-[#0f172a] rounded-xl space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Intervention {i + 1}</span>
              <button type="button" onClick={() => removeIntervention(i)} className="p-1 text-red-400"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField type="text" label="Title (EN)" value={v.titleEn} onChange={(val) => updateIntervention(i, "titleEn", val)} />
              <AdminFormField type="text" label="Title (AR)" value={v.titleAr} onChange={(val) => updateIntervention(i, "titleAr", val)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField type="textarea" label="Description (EN)" value={v.descriptionEn} onChange={(val) => updateIntervention(i, "descriptionEn", val)} rows={3} />
              <AdminFormField type="textarea" label="Description (AR)" value={v.descriptionAr} onChange={(val) => updateIntervention(i, "descriptionAr", val)} rows={3} />
            </div>
            <AdminFormField type="text" label="Icon" value={v.icon} onChange={(val) => updateIntervention(i, "icon", val)} />
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-xl transition-colors disabled:opacity-50">
        {saving && <Loader2 size={16} className="animate-spin" />} {saving ? "Saving..." : "Save All"}
      </button>
    </div>
  );
}
