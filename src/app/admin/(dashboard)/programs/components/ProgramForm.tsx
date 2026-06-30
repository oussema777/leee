"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import AdminFormField from "../../../components/AdminFormField";
import BilingualTabs from "../../../components/BilingualTabs";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut, adminGet } from "@/lib/admin-api";
import { slugify, cn } from "@/lib/utils";

interface ProgramImage { imageUrl: string; caption: string; order: number; }
interface ProgramTeamMember { nameEn: string; nameAr: string; roleEn: string; roleAr: string; imageUrl: string; linkedinUrl: string; order: number; }
interface ProgramPartner { nameEn: string; nameAr: string; logoUrl: string; websiteUrl: string; order: number; }
interface ProgramStat { labelEn: string; labelAr: string; value: number; suffix: string; icon: string; order: number; }
interface ProgramVideoItem { titleEn: string; titleAr: string; youtubeUrl: string; order: number; }

interface Pillar { id: string; titleEn: string; }

interface ProgramData {
  id?: string;
  slug: string;
  titleEn: string; titleAr: string;
  summaryEn: string; summaryAr: string;
  bodyEn: string; bodyAr: string;
  coverImageUrl: string;
  status: string;
  category: string;
  pillarId: string;
  donorEn: string; donorAr: string;
  locationEn: string; locationAr: string;
  budget: string;
  beneficiaries: number;
  year: number;
  startDate: string; endDate: string;
  objectivesEn: string; objectivesAr: string;
  isActive: boolean; isFeatured: boolean;
  images: ProgramImage[];
  teamMembers: ProgramTeamMember[];
  partners: ProgramPartner[];
  stats: ProgramStat[];
  videos: ProgramVideoItem[];
}

const emptyProgram: ProgramData = {
  slug: "", titleEn: "", titleAr: "", summaryEn: "", summaryAr: "",
  bodyEn: "", bodyAr: "", coverImageUrl: "", status: "ACTIVE", category: "",
  pillarId: "", donorEn: "", donorAr: "", locationEn: "", locationAr: "",
  budget: "", beneficiaries: 0, year: new Date().getFullYear(),
  startDate: "", endDate: "", objectivesEn: "", objectivesAr: "",
  isActive: true, isFeatured: false,
  images: [], teamMembers: [], partners: [], stats: [], videos: [],
};

const tabs = ["General", "Media", "Team", "Partners", "Stats"] as const;

export default function ProgramForm({ initial }: { initial?: any }) {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("General");
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<ProgramData>(() => {
    if (!initial) return emptyProgram;
    return {
      ...emptyProgram,
      ...initial,
      startDate: initial.startDate ? new Date(initial.startDate).toISOString().split("T")[0] : "",
      endDate: initial.endDate ? new Date(initial.endDate).toISOString().split("T")[0] : "",
      images: initial.images || [],
      teamMembers: initial.teamMembers || [],
      partners: initial.partners || [],
      stats: initial.stats || [],
      videos: initial.videos || [],
    };
  });

  useEffect(() => {
    // Fetch pillars for dropdown
    fetch("/api/admin/settings/pillars", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setPillars(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
  }, []);

  const set = <K extends keyof ProgramData>(key: K, value: ProgramData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn || !form.summaryEn || !form.bodyEn) {
      toast.error("Title, summary, and body (EN) are required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        pillarId: form.pillarId || null,
        beneficiaries: form.beneficiaries || null,
        year: form.year || null,
      };
      if (form.id) {
        await adminPut(`/programs/${form.id}`, payload);
        toast.success("Saved");
        router.refresh(); // revalidate server data, stay on the edit screen
      } else {
        const created = await adminPost<{ id: string }>("/programs", payload);
        toast.success("Created");
        // Switch into the new program's edit screen so it stays open
        // and re-saving updates instead of creating a duplicate.
        router.replace(`/admin/programs/${created.id}/edit`);
      }
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  // Inline CRUD helpers for arrays
  const addImage = () => set("images", [...form.images, { imageUrl: "", caption: "", order: form.images.length }]);
  const removeImage = (i: number) => set("images", form.images.filter((_, idx) => idx !== i));
  const updateImage = (i: number, key: keyof ProgramImage, val: any) => {
    const imgs = [...form.images]; imgs[i] = { ...imgs[i], [key]: val }; set("images", imgs);
  };

  const addTeamMember = () => set("teamMembers", [...form.teamMembers, { nameEn: "", nameAr: "", roleEn: "", roleAr: "", imageUrl: "", linkedinUrl: "", order: form.teamMembers.length }]);
  const removeTeamMember = (i: number) => set("teamMembers", form.teamMembers.filter((_, idx) => idx !== i));
  const updateTeamMember = (i: number, key: keyof ProgramTeamMember, val: any) => {
    const arr = [...form.teamMembers]; arr[i] = { ...arr[i], [key]: val }; set("teamMembers", arr);
  };

  const addPartner = () => set("partners", [...form.partners, { nameEn: "", nameAr: "", logoUrl: "", websiteUrl: "", order: form.partners.length }]);
  const removePartner = (i: number) => set("partners", form.partners.filter((_, idx) => idx !== i));
  const updatePartner = (i: number, key: keyof ProgramPartner, val: any) => {
    const arr = [...form.partners]; arr[i] = { ...arr[i], [key]: val }; set("partners", arr);
  };

  const addStat = () => set("stats", [...form.stats, { labelEn: "", labelAr: "", value: 0, suffix: "", icon: "", order: form.stats.length }]);
  const removeStat = (i: number) => set("stats", form.stats.filter((_, idx) => idx !== i));
  const updateStat = (i: number, key: keyof ProgramStat, val: any) => {
    const arr = [...form.stats]; arr[i] = { ...arr[i], [key]: val }; set("stats", arr);
  };

  const addVideo = () => set("videos", [...form.videos, { titleEn: "", titleAr: "", youtubeUrl: "", order: form.videos.length }]);
  const removeVideo = (i: number) => set("videos", form.videos.filter((_, idx) => idx !== i));
  const updateVideo = (i: number, key: keyof ProgramVideoItem, val: any) => {
    const arr = [...form.videos]; arr[i] = { ...arr[i], [key]: val }; set("videos", arr);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/programs" className="p-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">{form.id ? "Edit Program" : "New Program"}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1e293b] rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              activeTab === tab ? "bg-brand-blue text-white" : "text-gray-400 hover:text-white"
            )}>
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 p-6 space-y-5">

          {/* General Tab */}
          {activeTab === "General" && (
            <>
              <BilingualTabs>
                {(lang) => (
                  <div className="space-y-4">
                    <AdminFormField type="text" label={`Title (${lang.toUpperCase()})`}
                      value={lang === "en" ? form.titleEn : form.titleAr}
                      onChange={(v) => { if (lang === "en") { set("titleEn", v); if (!form.id) set("slug", slugify(v)); } else set("titleAr", v); }}
                      required={lang === "en"} />
                    <AdminFormField type="textarea" label={`Summary (${lang.toUpperCase()})`}
                      value={lang === "en" ? form.summaryEn : form.summaryAr}
                      onChange={(v) => set(lang === "en" ? "summaryEn" : "summaryAr", v)} required={lang === "en"} rows={3} />
                    <AdminFormField type="textarea" label={`Body (${lang.toUpperCase()})`}
                      value={lang === "en" ? form.bodyEn : form.bodyAr}
                      onChange={(v) => set(lang === "en" ? "bodyEn" : "bodyAr", v)} required={lang === "en"} rows={8} />
                    <AdminFormField type="textarea" label={`Objectives (${lang.toUpperCase()})`}
                      value={lang === "en" ? form.objectivesEn : form.objectivesAr}
                      onChange={(v) => set(lang === "en" ? "objectivesEn" : "objectivesAr", v)} rows={4} />
                    <AdminFormField type="text" label={`Donor (${lang.toUpperCase()})`}
                      value={lang === "en" ? form.donorEn : form.donorAr}
                      onChange={(v) => set(lang === "en" ? "donorEn" : "donorAr", v)} />
                    <AdminFormField type="text" label={`Location (${lang.toUpperCase()})`}
                      value={lang === "en" ? form.locationEn : form.locationAr}
                      onChange={(v) => set(lang === "en" ? "locationEn" : "locationAr", v)} />
                  </div>
                )}
              </BilingualTabs>
              <AdminFormField type="text" label="Slug" value={form.slug} onChange={(v) => set("slug", v)} required />
              <div className="grid grid-cols-2 gap-4">
                <AdminFormField type="select" label="Status" value={form.status} onChange={(v) => set("status", v)}
                  options={[{ label: "Active", value: "ACTIVE" }, { label: "Completed", value: "COMPLETED" }, { label: "Upcoming", value: "UPCOMING" }]} />
                <AdminFormField type="select" label="Pillar" value={form.pillarId} onChange={(v) => set("pillarId", v)}
                  options={pillars.map((p) => ({ label: p.titleEn, value: p.id }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AdminFormField type="text" label="Category" value={form.category} onChange={(v) => set("category", v)} />
                <AdminFormField type="text" label="Budget" value={form.budget} onChange={(v) => set("budget", v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AdminFormField type="number" label="Beneficiaries" value={form.beneficiaries} onChange={(v) => set("beneficiaries", parseInt(v) || 0)} />
                <AdminFormField type="number" label="Year" value={form.year} onChange={(v) => set("year", parseInt(v) || 0)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AdminFormField type="date" label="Start Date" value={form.startDate} onChange={(v) => set("startDate", v)} />
                <AdminFormField type="date" label="End Date" value={form.endDate} onChange={(v) => set("endDate", v)} />
              </div>
              <ImageUploader value={form.coverImageUrl} onChange={(url) => set("coverImageUrl", url)} onRemove={() => set("coverImageUrl", "")} folder="programs" label="Cover Image" />
              <AdminFormField type="toggle" label="Active" value={form.isActive} onChange={(v) => set("isActive", v)} />
              <AdminFormField type="toggle" label="Featured" value={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
            </>
          )}

          {/* Media Tab */}
          {activeTab === "Media" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Images</h3>
                  <button type="button" onClick={addImage} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline">
                    <Plus size={16} /> Add Image
                  </button>
                </div>
                {form.images.map((img, i) => (
                  <div key={i} className="flex gap-4 items-start mb-4 p-4 bg-[#0f172a] rounded-xl">
                    <div className="flex-1 space-y-3">
                      <ImageUploader value={img.imageUrl} onChange={(url) => updateImage(i, "imageUrl", url)} onRemove={() => updateImage(i, "imageUrl", "")} folder="programs" label={`Image ${i + 1}`} />
                      <AdminFormField type="text" label="Caption" value={img.caption} onChange={(v) => updateImage(i, "caption", v)} />
                    </div>
                    <button type="button" onClick={() => removeImage(i)} className="p-2 text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {form.images.length === 0 && <p className="text-gray-500 text-sm">No images added.</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Videos</h3>
                  <button type="button" onClick={addVideo} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline">
                    <Plus size={16} /> Add Video
                  </button>
                </div>
                {form.videos.map((vid, i) => (
                  <div key={i} className="flex gap-4 items-start mb-4 p-4 bg-[#0f172a] rounded-xl">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <AdminFormField type="text" label="Title (EN)" value={vid.titleEn} onChange={(v) => updateVideo(i, "titleEn", v)} />
                        <AdminFormField type="text" label="Title (AR)" value={vid.titleAr} onChange={(v) => updateVideo(i, "titleAr", v)} />
                      </div>
                      <AdminFormField type="url" label="YouTube URL" value={vid.youtubeUrl} onChange={(v) => updateVideo(i, "youtubeUrl", v)} />
                    </div>
                    <button type="button" onClick={() => removeVideo(i)} className="p-2 text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {form.videos.length === 0 && <p className="text-gray-500 text-sm">No videos added.</p>}
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === "Team" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Team Members</h3>
                <button type="button" onClick={addTeamMember} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline">
                  <Plus size={16} /> Add Member
                </button>
              </div>
              {form.teamMembers.map((tm, i) => (
                <div key={i} className="mb-4 p-4 bg-[#0f172a] rounded-xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-300">Member {i + 1}</span>
                    <button type="button" onClick={() => removeTeamMember(i)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <AdminFormField type="text" label="Name (EN)" value={tm.nameEn} onChange={(v) => updateTeamMember(i, "nameEn", v)} />
                    <AdminFormField type="text" label="Name (AR)" value={tm.nameAr} onChange={(v) => updateTeamMember(i, "nameAr", v)} />
                    <AdminFormField type="text" label="Role (EN)" value={tm.roleEn} onChange={(v) => updateTeamMember(i, "roleEn", v)} />
                    <AdminFormField type="text" label="Role (AR)" value={tm.roleAr} onChange={(v) => updateTeamMember(i, "roleAr", v)} />
                  </div>
                  <ImageUploader value={tm.imageUrl} onChange={(url) => updateTeamMember(i, "imageUrl", url)} onRemove={() => updateTeamMember(i, "imageUrl", "")} folder="programs/team" label="Photo" />
                  <AdminFormField type="url" label="LinkedIn" value={tm.linkedinUrl} onChange={(v) => updateTeamMember(i, "linkedinUrl", v)} />
                </div>
              ))}
              {form.teamMembers.length === 0 && <p className="text-gray-500 text-sm">No team members added.</p>}
            </div>
          )}

          {/* Partners Tab */}
          {activeTab === "Partners" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Program Partners</h3>
                <button type="button" onClick={addPartner} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline">
                  <Plus size={16} /> Add Partner
                </button>
              </div>
              {form.partners.map((p, i) => (
                <div key={i} className="mb-4 p-4 bg-[#0f172a] rounded-xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-300">Partner {i + 1}</span>
                    <button type="button" onClick={() => removePartner(i)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <AdminFormField type="text" label="Name (EN)" value={p.nameEn} onChange={(v) => updatePartner(i, "nameEn", v)} />
                    <AdminFormField type="text" label="Name (AR)" value={p.nameAr} onChange={(v) => updatePartner(i, "nameAr", v)} />
                  </div>
                  <ImageUploader value={p.logoUrl} onChange={(url) => updatePartner(i, "logoUrl", url)} onRemove={() => updatePartner(i, "logoUrl", "")} folder="programs/partners" label="Logo" />
                  <AdminFormField type="url" label="Website" value={p.websiteUrl} onChange={(v) => updatePartner(i, "websiteUrl", v)} />
                </div>
              ))}
              {form.partners.length === 0 && <p className="text-gray-500 text-sm">No partners added.</p>}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === "Stats" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Program Statistics</h3>
                <button type="button" onClick={addStat} className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline">
                  <Plus size={16} /> Add Stat
                </button>
              </div>
              {form.stats.map((s, i) => (
                <div key={i} className="mb-4 p-4 bg-[#0f172a] rounded-xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-300">Stat {i + 1}</span>
                    <button type="button" onClick={() => removeStat(i)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <AdminFormField type="text" label="Label (EN)" value={s.labelEn} onChange={(v) => updateStat(i, "labelEn", v)} />
                    <AdminFormField type="text" label="Label (AR)" value={s.labelAr} onChange={(v) => updateStat(i, "labelAr", v)} />
                    <AdminFormField type="number" label="Value" value={s.value} onChange={(v) => updateStat(i, "value", parseInt(v) || 0)} />
                    <AdminFormField type="text" label="Suffix" value={s.suffix} onChange={(v) => updateStat(i, "suffix", v)} placeholder="e.g. %, +, K" />
                  </div>
                  <AdminFormField type="text" label="Icon" value={s.icon} onChange={(v) => updateStat(i, "icon", v)} placeholder="Lucide icon name" />
                </div>
              ))}
              {form.stats.length === 0 && <p className="text-gray-500 text-sm">No statistics added.</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/admin/programs" className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors">Cancel</Link>
          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-xl transition-colors disabled:opacity-50">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
