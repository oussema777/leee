"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { adminGet, adminPatch } from "@/lib/admin-api";
import { useToast } from "../../../components/AdminToast";
import { BOOK_VOLUNTEER_STATUSES } from "@/lib/book-restore/volunteer";

type Status = (typeof BOOK_VOLUNTEER_STATUSES)[number];
type Volunteer = { id: string; reference: string; fullName: string; phone: string; email: string | null; governorate: string; area: string; interests: string[]; otherInterest: string | null; availability: string; experience: string | null; notes: string | null; locale: string; privacyConsent: boolean; consentTextVersion: string; status: Status; isRead: boolean; adminNotes: string | null; reviewedAt: string | null; createdAt: string; updatedAt: string };
const human = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, char => char.toUpperCase());
export default function BookVolunteerDetailPage() {
  const { id } = useParams<{ id: string }>(); const toast = useToast();
  const [item, setItem] = useState<Volunteer | null>(null); const [status, setStatus] = useState<Status>("NEW");
  const [notes, setNotes] = useState(""); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { adminGet<Volunteer>(`/book-volunteers/${id}`).then(value => { setItem(value); setStatus(value.status); setNotes(value.adminNotes || ""); }).catch(() => toast.error("Could not load volunteer application")).finally(() => setLoading(false)); }, [id, toast]);
  async function save() {
    if (!item) return; setSaving(true);
    try { const value = await adminPatch<Volunteer>(`/book-volunteers/${id}`, { status, adminNotes: notes, expectedUpdatedAt: item.updatedAt }); setItem(value); toast.success("Volunteer application updated"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not update application"); }
    finally { setSaving(false); }
  }
  if (loading) return <p className="p-8 text-gray-400">Loading volunteer application…</p>;
  if (!item) return <p className="p-8 text-gray-400">Application not found.</p>;
  const detail = (label: string, value: string | null | undefined) => <div key={label}><dt className="text-xs font-semibold uppercase text-gray-400">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-white">{value || "—"}</dd></div>;
  return <div className="max-w-5xl"><Link href="/admin/book-volunteers" className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft size={16} />Back to volunteers</Link>
    <header className="mb-7"><p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Book Restore volunteer</p><h1 className="mt-2 text-3xl font-bold text-white">{item.fullName}</h1><p className="mt-2 text-sm text-gray-400">{item.reference} · Submitted {new Date(item.createdAt).toLocaleString()}</p></header>
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]"><div className="space-y-6">
      <section className="rounded-xl bg-[#1e293b] p-6"><h2 className="mb-5 font-semibold text-white">Contact and location</h2><dl className="grid gap-5 sm:grid-cols-2">
        {detail("Name", item.fullName)}<div><dt className="text-xs font-semibold uppercase text-gray-400">Phone / WhatsApp</dt><dd className="mt-1"><a href={`tel:${item.phone}`} className="inline-flex items-center gap-2 text-brand-blue"><Phone size={15} />{item.phone}</a></dd></div>
        <div><dt className="text-xs font-semibold uppercase text-gray-400">Email</dt><dd className="mt-1">{item.email ? <a href={`mailto:${item.email}`} className="inline-flex items-center gap-2 text-brand-blue"><Mail size={15} />{item.email}</a> : "—"}</dd></div>
        {detail("Location", `${item.area}, ${human(item.governorate)}`)}
      </dl></section>
      <section className="rounded-xl bg-[#1e293b] p-6"><h2 className="mb-5 font-semibold text-white">Volunteer offer</h2><dl className="grid gap-5 sm:grid-cols-2">{detail("Activities", item.interests.map(human).join(", "))}{detail("Other activity", item.otherInterest)}{detail("Availability", human(item.availability))}{detail("Experience", item.experience)}{detail("Additional notes", item.notes)}</dl></section>
      <section className="rounded-xl bg-[#1e293b] p-6"><h2 className="mb-4 font-semibold text-white">Consent record</h2><dl className="grid gap-4 sm:grid-cols-2">{detail("Privacy consent", item.privacyConsent ? "Yes" : "No")}{detail("Language", item.locale === "ar" ? "Arabic" : "English")}{detail("Consent version", item.consentTextVersion)}</dl></section>
    </div><aside className="h-fit rounded-xl bg-[#1e293b] p-6 lg:sticky lg:top-6"><h2 className="font-semibold text-white">Follow up</h2>
      <label className="mt-5 block text-xs font-semibold uppercase text-gray-400">Status<select value={status} onChange={event => setStatus(event.target.value as Status)} className="mt-2 w-full rounded-xl border border-gray-700 bg-[#0f172a] px-3 py-2.5 text-sm text-white">{BOOK_VOLUNTEER_STATUSES.map(value => <option key={value} value={value}>{human(value)}</option>)}</select></label>
      <label className="mt-5 block text-xs font-semibold uppercase text-gray-400">Internal notes<textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={5000} rows={7} className="mt-2 w-full rounded-xl border border-gray-700 bg-[#0f172a] px-3 py-2.5 text-sm normal-case leading-6 text-white" /></label>
      <button type="button" onClick={save} disabled={saving} className="mt-5 w-full rounded-xl bg-brand-blue px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save follow-up"}</button>
    </aside></div>
  </div>;
}
