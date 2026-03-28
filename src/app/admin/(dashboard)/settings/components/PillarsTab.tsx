"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPut, adminPost, adminDelete } from "@/lib/admin-api";
import AdminModal from "../../../components/AdminModal";

interface SubPillar { titleEn: string; titleAr: string; bodyEn: string; bodyAr: string; order: number; }
interface PillarInfo { labelEn: string; labelAr: string; value: string; order: number; }
interface Pillar {
  id?: string;
  slug: string; titleEn: string; titleAr: string;
  descriptionEn: string; descriptionAr: string;
  iconUrl: string; imageUrl: string;
  order: number; isActive: boolean;
  subPillars: SubPillar[];
  pillarInfos: PillarInfo[];
}

export default function PillarsTab() {
  const toast = useToast();
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pillar | null>(null);

  const fetchPillars = () => {
    adminGet<Pillar[]>("/settings/pillars").then(setPillars).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPillars(); }, []);

  const updatePillar = (idx: number, field: keyof Pillar, val: any) => {
    const arr = [...pillars]; arr[idx] = { ...arr[idx], [field]: val }; setPillars(arr);
  };

  const addSubPillar = (idx: number) => {
    const arr = [...pillars];
    arr[idx] = { ...arr[idx], subPillars: [...arr[idx].subPillars, { titleEn: "", titleAr: "", bodyEn: "", bodyAr: "", order: arr[idx].subPillars.length }] };
    setPillars(arr);
  };

  const removeSubPillar = (pIdx: number, sIdx: number) => {
    const arr = [...pillars];
    arr[pIdx] = { ...arr[pIdx], subPillars: arr[pIdx].subPillars.filter((_, i) => i !== sIdx) };
    setPillars(arr);
  };

  const updateSubPillar = (pIdx: number, sIdx: number, field: keyof SubPillar, val: any) => {
    const arr = [...pillars];
    const subs = [...arr[pIdx].subPillars];
    subs[sIdx] = { ...subs[sIdx], [field]: val };
    arr[pIdx] = { ...arr[pIdx], subPillars: subs };
    setPillars(arr);
  };

  const addPillarInfo = (idx: number) => {
    const arr = [...pillars];
    arr[idx] = { ...arr[idx], pillarInfos: [...arr[idx].pillarInfos, { labelEn: "", labelAr: "", value: "", order: arr[idx].pillarInfos.length }] };
    setPillars(arr);
  };

  const removePillarInfo = (pIdx: number, iIdx: number) => {
    const arr = [...pillars];
    arr[pIdx] = { ...arr[pIdx], pillarInfos: arr[pIdx].pillarInfos.filter((_, i) => i !== iIdx) };
    setPillars(arr);
  };

  const updatePillarInfo = (pIdx: number, iIdx: number, field: keyof PillarInfo, val: any) => {
    const arr = [...pillars];
    const infos = [...arr[pIdx].pillarInfos];
    infos[iIdx] = { ...infos[iIdx], [field]: val };
    arr[pIdx] = { ...arr[pIdx], pillarInfos: infos };
    setPillars(arr);
  };

  const addPillar = () => {
    setPillars([...pillars, {
      slug: "", titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "",
      iconUrl: "", imageUrl: "", order: pillars.length, isActive: true, subPillars: [], pillarInfos: [],
    }]);
  };

  const savePillar = async (idx: number) => {
    const p = pillars[idx];
    const key = p.id || `new-${idx}`;
    setSaving(key);
    try {
      if (p.id) {
        await adminPut("/settings/pillars", p);
      } else {
        await adminPost("/settings/pillars", p);
      }
      toast.success("Pillar saved");
      fetchPillars();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(null); }
  };

  const deletePillar = async () => {
    if (!deleteTarget?.id) {
      setPillars(pillars.filter((p) => p !== deleteTarget));
      setDeleteTarget(null);
      return;
    }
    try {
      await adminDelete("/settings/pillars");
      toast.success("Deleted");
      setDeleteTarget(null);
      fetchPillars();
    } catch { toast.error("Failed to delete"); }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Pillars</h3>
        <button type="button" onClick={addPillar} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline">
          <Plus size={16} /> Add Pillar
        </button>
      </div>

      {pillars.map((pillar, pIdx) => (
        <div key={pillar.id || pIdx} className="bg-[#0f172a] rounded-xl overflow-hidden">
          <button type="button" onClick={() => setExpanded(expanded === (pillar.id || `${pIdx}`) ? null : (pillar.id || `${pIdx}`))}
            className="w-full flex items-center justify-between p-4 text-left">
            <span className="text-sm font-medium text-white">{pillar.titleEn || "New Pillar"}</span>
            {expanded === (pillar.id || `${pIdx}`) ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expanded === (pillar.id || `${pIdx}`) && (
            <div className="p-4 pt-0 space-y-4">
              <BilingualTabs>
                {(lang) => (
                  <div className="space-y-3">
                    <AdminFormField type="text" label={`Title (${lang.toUpperCase()})`}
                      value={lang === "en" ? pillar.titleEn : pillar.titleAr}
                      onChange={(v) => updatePillar(pIdx, lang === "en" ? "titleEn" : "titleAr", v)} />
                    <AdminFormField type="textarea" label={`Description (${lang.toUpperCase()})`}
                      value={lang === "en" ? pillar.descriptionEn : pillar.descriptionAr}
                      onChange={(v) => updatePillar(pIdx, lang === "en" ? "descriptionEn" : "descriptionAr", v)} rows={4} />
                  </div>
                )}
              </BilingualTabs>

              <AdminFormField type="text" label="Slug" value={pillar.slug} onChange={(v) => updatePillar(pIdx, "slug", v)} />
              <AdminFormField type="toggle" label="Active" value={pillar.isActive} onChange={(v) => updatePillar(pIdx, "isActive", v)} />

              {/* Sub-Pillars */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Sub-Pillars</span>
                  <button type="button" onClick={() => addSubPillar(pIdx)} className="text-xs text-brand-blue hover:underline">+ Add</button>
                </div>
                {pillar.subPillars.map((sp, sIdx) => (
                  <div key={sIdx} className="mb-2 p-3 bg-[#1e293b] rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Sub-Pillar {sIdx + 1}</span>
                      <button type="button" onClick={() => removeSubPillar(pIdx, sIdx)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <AdminFormField type="text" label="Title (EN)" value={sp.titleEn} onChange={(v) => updateSubPillar(pIdx, sIdx, "titleEn", v)} />
                      <AdminFormField type="text" label="Title (AR)" value={sp.titleAr} onChange={(v) => updateSubPillar(pIdx, sIdx, "titleAr", v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <AdminFormField type="textarea" label="Body (EN)" value={sp.bodyEn} onChange={(v) => updateSubPillar(pIdx, sIdx, "bodyEn", v)} rows={3} />
                      <AdminFormField type="textarea" label="Body (AR)" value={sp.bodyAr} onChange={(v) => updateSubPillar(pIdx, sIdx, "bodyAr", v)} rows={3} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pillar Info */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Info Items</span>
                  <button type="button" onClick={() => addPillarInfo(pIdx)} className="text-xs text-brand-blue hover:underline">+ Add</button>
                </div>
                {pillar.pillarInfos.map((info, iIdx) => (
                  <div key={iIdx} className="mb-2 p-3 bg-[#1e293b] rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Info {iIdx + 1}</span>
                      <button type="button" onClick={() => removePillarInfo(pIdx, iIdx)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <AdminFormField type="text" label="Label (EN)" value={info.labelEn} onChange={(v) => updatePillarInfo(pIdx, iIdx, "labelEn", v)} />
                      <AdminFormField type="text" label="Label (AR)" value={info.labelAr} onChange={(v) => updatePillarInfo(pIdx, iIdx, "labelAr", v)} />
                      <AdminFormField type="text" label="Value" value={info.value} onChange={(v) => updatePillarInfo(pIdx, iIdx, "value", v)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => savePillar(pIdx)} disabled={saving === (pillar.id || `new-${pIdx}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-xl transition-colors disabled:opacity-50">
                  {saving === (pillar.id || `new-${pIdx}`) && <Loader2 size={14} className="animate-spin" />} Save Pillar
                </button>
                <button onClick={() => setDeleteTarget(pillar)}
                  className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors">Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {pillars.length === 0 && <p className="text-gray-500 text-sm">No pillars added.</p>}

      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deletePillar}
        title="Delete Pillar" message={`Delete "${deleteTarget?.titleEn}"? This will also delete all sub-pillars and info items.`} confirmLabel="Delete"
      />
    </div>
  );
}
