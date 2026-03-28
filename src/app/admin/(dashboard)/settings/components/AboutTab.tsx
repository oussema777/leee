"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPut } from "@/lib/admin-api";

interface AboutItem {
  id?: string;
  section: string;
  titleEn: string; titleAr: string;
  bodyEn: string; bodyAr: string;
  imageUrl: string | null;
}

const sections = ["OVERVIEW", "VISION", "MISSION", "IMPACT"];

export default function AboutTab() {
  const toast = useToast();
  const [items, setItems] = useState<AboutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    adminGet<AboutItem[]>("/settings/about")
      .then((data) => {
        const mapped = sections.map((s) => {
          const existing = data.find((d) => d.section === s);
          return existing || { section: s, titleEn: "", titleAr: "", bodyEn: "", bodyAr: "", imageUrl: null };
        });
        setItems(mapped);
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [toast]);

  const update = (section: string, field: keyof AboutItem, val: any) => {
    setItems((prev) => prev.map((item) => item.section === section ? { ...item, [field]: val } : item));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminPut("/settings/about", items);
      toast.success("About content saved");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">About Content</h3>
      {items.map((item) => (
        <div key={item.section} className="bg-[#0f172a] rounded-xl overflow-hidden">
          <button type="button" onClick={() => setExpanded(expanded === item.section ? null : item.section)}
            className="w-full flex items-center justify-between p-4 text-left">
            <span className="text-sm font-medium text-white">{item.section}</span>
            {expanded === item.section ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {expanded === item.section && (
            <div className="p-4 pt-0 space-y-4">
              <BilingualTabs>
                {(lang) => (
                  <div className="space-y-3">
                    <AdminFormField type="text" label={`Title (${lang.toUpperCase()})`}
                      value={lang === "en" ? item.titleEn : item.titleAr}
                      onChange={(v) => update(item.section, lang === "en" ? "titleEn" : "titleAr", v)} />
                    <AdminFormField type="textarea" label={`Body (${lang.toUpperCase()})`}
                      value={lang === "en" ? item.bodyEn : item.bodyAr}
                      onChange={(v) => update(item.section, lang === "en" ? "bodyEn" : "bodyAr", v)} rows={6} />
                  </div>
                )}
              </BilingualTabs>
              <ImageUploader value={item.imageUrl || ""} onChange={(url) => update(item.section, "imageUrl", url)}
                onRemove={() => update(item.section, "imageUrl", null)} folder="about" />
            </div>
          )}
        </div>
      ))}
      <button onClick={save} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-xl transition-colors disabled:opacity-50">
        {saving && <Loader2 size={16} className="animate-spin" />} {saving ? "Saving..." : "Save All"}
      </button>
    </div>
  );
}
