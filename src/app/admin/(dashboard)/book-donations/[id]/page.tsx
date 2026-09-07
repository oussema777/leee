"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail, Phone, Save } from "lucide-react";
import { adminGet, adminPatch } from "@/lib/admin-api";
import { BOOK_DONATION_STATUSES } from "@/lib/book-restore/validation";
import { useToast } from "../../../components/AdminToast";

type Status = (typeof BOOK_DONATION_STATUSES)[number];
interface DonationBook { title: string; author?: string; category: string; language: string; condition: string; frontCoverUrl: string; backCoverUrl: string; }
interface Donation {
  id: string; reference: string; fullName: string; phone: string; email: string | null;
  governorate: string; area: string; detailedAddress: string | null; estimatedQuantity: string;
  bookCategories: string[]; otherCategory: string | null; bookLanguages: string[]; overallCondition: string;
  handoverMethod: string; photoUrls: string[]; notes: string | null; locale: string;
  books: DonationBook[] | null;
  donationConsent: boolean; privacyConsent: boolean; acceptanceAcknowledged: boolean;
  consentTextVersion: string; status: Status; adminNotes: string | null; reviewedAt: string | null;
  createdAt: string; updatedAt: string;
}

const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const isDonationBook = (value: unknown): value is DonationBook => Boolean(value && typeof value === "object" && "title" in value && "frontCoverUrl" in value && "backCoverUrl" in value);

function Detail({ label, children, dir }: { label: string; children: React.ReactNode; dir?: "ltr" | "rtl" }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt><dd className="mt-1 text-sm leading-6 text-gray-200" dir={dir}>{children || "—"}</dd></div>;
}

export default function BookDonationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [status, setStatus] = useState<Status>("NEW");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGet<Donation>(`/book-donations/${id}`)
      .then((item) => { setDonation(item); setStatus(item.status); setAdminNotes(item.adminNotes ?? ""); })
      .catch(() => toast.error("Failed to load book donation"))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const save = async () => {
    setSaving(true);
    try {
      const item = await adminPatch<Donation>(`/book-donations/${id}`, { status, adminNotes });
      setDonation(item);
      toast.success("Book donation updated");
    } catch { toast.error("Failed to update book donation"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="size-7 animate-spin text-brand-blue" /></div>;
  if (!donation) return <div className="rounded-xl bg-[#1e293b] p-8 text-center text-gray-400">Book donation not found.</div>;
  const textDirection = donation.locale === "ar" ? "rtl" : "ltr";
  const individualBooks = Array.isArray(donation.books) ? donation.books.filter(isDonationBook) : [];

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/book-donations" className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft size={16} /> Back to book donations</Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-bold text-white">{donation.reference}</h1><p className="mt-1 text-sm text-gray-400">Submitted {new Date(donation.createdAt).toLocaleString()}</p></div>
        <span className="self-start rounded-full bg-brand-blue/15 px-3 py-1.5 text-xs font-semibold text-brand-blue">{humanize(donation.status)}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-xl bg-[#1e293b] p-6"><h2 className="mb-5 text-base font-semibold text-white">Donor and location</h2><dl className="grid gap-5 sm:grid-cols-2">
            <Detail label="Full name" dir={textDirection}>{donation.fullName}</Detail><Detail label="Preferred language">{donation.locale === "ar" ? "Arabic" : "English"}</Detail>
            <Detail label="Phone / WhatsApp"><a href={`tel:${donation.phone}`} className="inline-flex items-center gap-2 text-brand-blue hover:underline"><Phone size={14} />{donation.phone}</a></Detail>
            <Detail label="Email">{donation.email ? <a href={`mailto:${donation.email}`} className="inline-flex items-center gap-2 text-brand-blue hover:underline"><Mail size={14} />{donation.email}</a> : "—"}</Detail>
            <Detail label="Governorate">{humanize(donation.governorate)}</Detail><Detail label="Area" dir={textDirection}>{donation.area}</Detail>
            {donation.detailedAddress && <div className="sm:col-span-2"><Detail label="Pickup address" dir={textDirection}>{donation.detailedAddress}</Detail></div>}
          </dl></section>
          <section className="rounded-xl bg-[#1e293b] p-6"><h2 className="mb-5 text-base font-semibold text-white">Books and handover</h2><dl className="grid gap-5 sm:grid-cols-2">
            <Detail label="Estimated quantity">{humanize(donation.estimatedQuantity)}</Detail><Detail label="Overall condition">{humanize(donation.overallCondition)}</Detail>
            <Detail label="Categories">{donation.bookCategories.map(humanize).join(", ")}{donation.otherCategory ? ` — ${donation.otherCategory}` : ""}</Detail>
            <Detail label="Languages">{donation.bookLanguages.length ? donation.bookLanguages.map(humanize).join(", ") : "Not provided"}</Detail>
            <Detail label="Handover method">{humanize(donation.handoverMethod)}</Detail><Detail label="Individual books">{individualBooks.length ? `${individualBooks.length} recorded below` : "Legacy summary only"}</Detail>
            {donation.notes && <div className="sm:col-span-2"><Detail label="Donor notes" dir={textDirection}><span className="whitespace-pre-wrap">{donation.notes}</span></Detail></div>}
          </dl></section>
          {individualBooks.length > 0 && <section className="rounded-xl bg-[#1e293b] p-6"><h2 className="mb-5 text-base font-semibold text-white">Individual books</h2><div className="space-y-5">{individualBooks.map((book, index) => <article key={`${book.title}-${index}`} className="rounded-xl border border-gray-700 bg-[#0f172a] p-4"><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Book {index + 1}</p><h3 className="mt-1 text-lg font-semibold text-white" dir={textDirection}>{book.title}</h3>{book.author && <p className="mt-1 text-sm text-gray-400" dir={textDirection}>by {book.author}</p>}</div><dl className="mb-4 grid gap-4 sm:grid-cols-3"><Detail label="Category">{humanize(book.category)}</Detail><Detail label="Language">{humanize(book.language)}</Detail><Detail label="Condition">{humanize(book.condition)}</Detail></dl><div className="grid gap-4 sm:grid-cols-2">{[["Front cover", book.frontCoverUrl], ["Back cover", book.backCoverUrl]].map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-gray-700 bg-[#1e293b]"><img src={url} alt={`${label} of ${book.title}`} className="aspect-[4/3] w-full object-contain" /><span className="block border-t border-gray-700 px-3 py-2 text-xs font-semibold text-gray-300">{label}</span></a>)}</div></article>)}</div></section>}
          <section className="rounded-xl bg-[#1e293b] p-6"><h2 className="mb-5 text-base font-semibold text-white">Consent record</h2><dl className="grid gap-5 sm:grid-cols-2">
            <Detail label="Free donation confirmed">{donation.donationConsent ? "Yes" : "No"}</Detail><Detail label="Privacy acknowledged">{donation.privacyConsent ? "Yes" : "No"}</Detail>
            <Detail label="Acceptance acknowledged">{donation.acceptanceAcknowledged ? "Yes" : "No"}</Detail><Detail label="Consent version"><span className="break-all text-xs">{donation.consentTextVersion}</span></Detail>
          </dl></section>
        </div>
        <aside className="h-fit rounded-xl bg-[#1e293b] p-6 lg:sticky lg:top-6">
          <h2 className="text-base font-semibold text-white">Manage donation</h2>
          <label htmlFor="status" className="mt-5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
          <select id="status" value={status} onChange={(event) => setStatus(event.target.value as Status)} className="mt-2 w-full rounded-lg border border-gray-700 bg-[#0f172a] px-3 py-2.5 text-sm text-white focus:border-brand-blue focus:outline-none">{BOOK_DONATION_STATUSES.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select>
          <label htmlFor="adminNotes" className="mt-5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Internal notes</label>
          <textarea id="adminNotes" rows={8} maxLength={5000} value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} className="mt-2 w-full resize-y rounded-lg border border-gray-700 bg-[#0f172a] px-3 py-2.5 text-sm leading-6 text-white placeholder:text-gray-600 focus:border-brand-blue focus:outline-none" placeholder="Follow-up details, agreed date, or routing notes…" />
          <button type="button" onClick={save} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Saving…" : "Save changes"}</button>
          <p className="mt-4 text-xs leading-5 text-gray-500">This record cannot be deleted from the admin interface. Use status and the approved retention policy.</p>
        </aside>
      </div>
    </div>
  );
}
