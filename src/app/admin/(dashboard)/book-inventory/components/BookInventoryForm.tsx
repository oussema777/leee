"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPost, adminPut } from "@/lib/admin-api";
import { BOOK_CONDITIONS, BOOK_CURRENCIES, BOOK_INVENTORY_STATUSES, BOOK_LANGUAGES } from "@/lib/book-inventory/validation";
import { getBookCategories } from "@/lib/book-inventory/categories";
import BookCategoryPicker from "./BookCategoryPicker";

interface BookFormData {
  id?: string; sku: string; title: string; titleAr: string; author: string; authorAr: string;
  descriptionEn: string; descriptionAr: string; isbn: string; publisher: string; publicationYear: string;
  editions: { id?: string; label: string; publicationYear: string; stockQuantity: number; coverImageUrl: string }[];
  categories: string[]; language: string; condition: string; price: string; currency: string;
  stockQuantity: number; shelfLocation: string; coverImageUrl: string; status: string; isPublished: boolean; internalNotes: string; donorId: string;
}

type DonorOption = { id: string; displayName: string; type: string; phone: string };
type NewDonor = { type: "INDIVIDUAL" | "ORGANISATION"; displayName: string; contactName: string; phone: string; email: string; logoUrl: string; logoApproved: boolean; publicRecognition: boolean; active: boolean; adminNotes: string };
const emptyDonor: NewDonor = { type: "INDIVIDUAL", displayName: "", contactName: "", phone: "", email: "", logoUrl: "", logoApproved: false, publicRecognition: false, active: true, adminNotes: "" };

type BookFormInitial = Omit<Partial<BookFormData>, "publicationYear" | "editions"> & { category?: string; customCategory?: string | null; priceCents?: number; publicationYear?: number | null; donor?: { id: string; displayName?: string; type?: string; phone?: string } | null; editions?: { id: string; label: string | null; publicationYear: number | null; stockQuantity: number; coverImageUrl: string | null }[] };
const empty: BookFormData = { sku: "", title: "", titleAr: "", author: "", authorAr: "", descriptionEn: "", descriptionAr: "", isbn: "", publisher: "", publicationYear: "", editions: [{ label: "", publicationYear: "", stockQuantity: 1, coverImageUrl: "" }], categories: [], language: "ARABIC", condition: "GOOD", price: "5", currency: "USD", stockQuantity: 1, shelfLocation: "", coverImageUrl: "", status: "AVAILABLE", isPublished: false, internalNotes: "", donorId: "" };
const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const options = (values: readonly string[]) => values.map((value) => ({ value, label: humanize(value) }));
function toForm(initial?: BookFormInitial) {
  if (!initial) return { ...empty, categories: [] };
  const populatedFields = Object.fromEntries(Object.entries(initial).filter(([, value]) => value != null));
  return { ...empty, ...populatedFields, donorId: initial.donor?.id || initial.donorId || "", categories: getBookCategories(initial), price: initial.priceCents == null ? "0" : String(initial.priceCents / 100), publicationYear: initial.publicationYear == null ? "" : String(initial.publicationYear), editions: initial.editions?.map((edition) => ({ ...edition, label: edition.label || "", publicationYear: edition.publicationYear == null ? "" : String(edition.publicationYear), coverImageUrl: edition.coverImageUrl || "" })) || empty.editions } as BookFormData;
}

export default function BookInventoryForm({ initial }: { initial?: BookFormInitial }) {
  const router = useRouter(); const toast = useToast();
  const [form, setForm] = useState<BookFormData>(() => toForm(initial)); const [loading, setLoading] = useState(false);
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [donors, setDonors] = useState<DonorOption[]>([]);
  const [donorMode, setDonorMode] = useState<"EXISTING" | "NEW">("EXISTING");
  const [donorQuery, setDonorQuery] = useState(initial?.donor?.displayName || "");
  const [donorPickerOpen, setDonorPickerOpen] = useState(false);
  const [newDonor, setNewDonor] = useState<NewDonor>(emptyDonor);
  const [creatingDonor, setCreatingDonor] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const set = <K extends keyof BookFormData>(key: K, value: BookFormData[K]) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    adminGet<{ data: string[] }>('/book-inventory/categories')
      .then((result) => setSavedCategories(result.data))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      adminGet<{ data: DonorOption[] }>(`/book-donors?limit=100&search=${encodeURIComponent(donorQuery.trim())}`)
        .then((result) => setDonors(result.data))
        .catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [donorQuery]);

  const createAndSelectDonor = async () => {
    setCreatingDonor(true);
    try {
      const created = await adminPost<DonorOption>("/book-donors", newDonor);
      setDonors((current) => [created, ...current]);
      set("donorId", created.id);
      setDonorQuery(created.displayName);
      setDonorPickerOpen(false);
      setNewDonor(emptyDonor);
      setDonorMode("EXISTING");
      toast.success(`${created.displayName} created and selected`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create donor");
    } finally {
      setCreatingDonor(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.categories.length) {
      setCategoryError("Select at least one category.");
      document.getElementById("book-categories")?.focus();
      return;
    }
    setLoading(true);
    try {
      const stockQuantity = form.editions.reduce((total, edition) => total + edition.stockQuantity, 0);
      const status = stockQuantity === 0 && form.status === "AVAILABLE" ? "RESERVED" : stockQuantity > 0 && form.status === "RESERVED" ? "AVAILABLE" : form.status;
      const payload = { ...form, status, stockQuantity, priceCents: Math.round(Math.max(0, Number(form.price) || 0) * 100), publicationYear: form.publicationYear || undefined };
      if (form.id) await adminPut("/book-inventory/" + form.id, payload); else await adminPost("/book-inventory", payload);
      toast.success(form.id ? "Book updated" : "Book added to inventory"); router.push("/admin/book-inventory");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to save book"); } finally { setLoading(false); }
  };

  return <AdminFormPage title={form.id ? "Edit Book" : "Add Book"} backHref="/admin/book-inventory" onSubmit={handleSubmit} loading={loading}>
    <div className="grid gap-5 md:grid-cols-2">
      <AdminFormField type="text" label="Title" value={form.title} onChange={(value) => set("title", value)} required />
      <AdminFormField type="text" label="Arabic title (optional)" value={form.titleAr} onChange={(value) => set("titleAr", value)} />
      <AdminFormField type="text" label="Author" value={form.author} onChange={(value) => set("author", value)} required />
      <AdminFormField type="text" label="Arabic author (optional)" value={form.authorAr} onChange={(value) => set("authorAr", value)} />
      <AdminFormField type="text" label="SKU (leave empty to generate)" value={form.sku} onChange={(value) => set("sku", value.toUpperCase())} placeholder="BK-260906-AB12CD" />
      <AdminFormField type="text" label="ISBN (optional)" value={form.isbn} onChange={(value) => set("isbn", value)} />
      <AdminFormField type="text" label="Publisher (optional)" value={form.publisher} onChange={(value) => set("publisher", value)} />
      <AdminFormField type="number" label="Original publication year (optional)" value={form.publicationYear} onChange={(value) => set("publicationYear", value)} />
    </div>
    <section className="rounded-2xl border border-gray-700/60 p-5">
      <div><h2 className="font-semibold text-white">Donor</h2><p className="mt-1 text-xs text-gray-400">Choose a saved donor or create one here without leaving this book.</p></div>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#0f172a] p-1">{(["EXISTING", "NEW"] as const).map((mode) => <button key={mode} type="button" onClick={() => setDonorMode(mode)} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${donorMode === mode ? "bg-brand-blue text-white" : "text-gray-400 hover:text-white"}`}>{mode === "EXISTING" ? "Select existing" : "Create new donor"}</button>)}</div>
      {donorMode === "EXISTING" ? <div className="relative mt-5">
        <label htmlFor="donor-combobox" className="mb-2 block text-sm font-medium text-gray-300">Search or select donor <span className="font-normal text-gray-500">(optional)</span></label>
        <input id="donor-combobox" role="combobox" aria-expanded={donorPickerOpen} aria-controls="donor-options" aria-autocomplete="list" autoComplete="off" value={donorQuery} onFocus={() => setDonorPickerOpen(true)} onBlur={() => window.setTimeout(() => setDonorPickerOpen(false), 120)} onChange={(event) => { setDonorQuery(event.target.value); set("donorId", ""); setDonorPickerOpen(true); }} placeholder="Type a name, organisation, phone, or email" className="w-full rounded-xl border border-gray-700 bg-[#0f172a] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-brand-blue" />
        {donorPickerOpen && <div id="donor-options" role="listbox" className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-700 bg-[#111c31] p-1 shadow-2xl">
          {donors.length ? donors.map((donor) => <button key={donor.id} type="button" role="option" aria-selected={form.donorId === donor.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { set("donorId", donor.id); setDonorQuery(donor.displayName); setDonorPickerOpen(false); }} className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-3 text-start text-sm hover:bg-gray-700/60 ${form.donorId === donor.id ? "bg-brand-blue/20 text-white" : "text-gray-200"}`}><span><strong className="block font-semibold">{donor.displayName}</strong><span className="mt-0.5 block text-xs text-gray-400">{donor.type === "ORGANISATION" ? "Organisation" : "Individual"}{donor.phone ? ` — ${donor.phone}` : ""}</span></span>{form.donorId === donor.id && <span className="text-xs font-semibold text-brand-blue">Selected</span>}</button>) : <p className="px-3 py-4 text-sm text-gray-400">No matching donors.</p>}
        </div>}
        {form.donorId && <p className="mt-2 text-xs font-medium text-emerald-400">Donor selected. Clear or edit the field to remove the selection.</p>}
      </div> : <div className="mt-5 space-y-5 rounded-xl bg-[#0f172a] p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <AdminFormField type="select" label="Donor type" value={newDonor.type} onChange={(value) => setNewDonor((current) => ({ ...current, type: value as NewDonor["type"], ...(value === "INDIVIDUAL" ? { contactName: "", logoUrl: "", logoApproved: false } : {}) }))} options={[{ value: "INDIVIDUAL", label: "Individual" }, { value: "ORGANISATION", label: "Organisation" }]} required />
          <AdminFormField type="text" label={newDonor.type === "ORGANISATION" ? "Organisation name (optional)" : "Full name (optional)"} value={newDonor.displayName} onChange={(value) => setNewDonor((current) => ({ ...current, displayName: value }))} />
          {newDonor.type === "ORGANISATION" && <AdminFormField type="text" label="Contact person (optional)" value={newDonor.contactName} onChange={(value) => setNewDonor((current) => ({ ...current, contactName: value }))} />}
          <AdminFormField type="text" label="Phone / WhatsApp (optional)" value={newDonor.phone} onChange={(value) => setNewDonor((current) => ({ ...current, phone: value }))} />
          <AdminFormField type="email" label="Email (optional)" value={newDonor.email} onChange={(value) => setNewDonor((current) => ({ ...current, email: value }))} />
        </div>
        {newDonor.type === "ORGANISATION" && <><ImageUploader value={newDonor.logoUrl} onChange={(value) => setNewDonor((current) => ({ ...current, logoUrl: value }))} onRemove={() => setNewDonor((current) => ({ ...current, logoUrl: "", logoApproved: false }))} folder="book-donors" label="Organisation logo (optional)" /><AdminFormField type="toggle" label="Logo approved for public display" value={newDonor.logoApproved} onChange={(value) => setNewDonor((current) => ({ ...current, logoApproved: value }))} /></>}
        <AdminFormField type="toggle" label="Public recognition" value={newDonor.publicRecognition} onChange={(value) => setNewDonor((current) => ({ ...current, publicRecognition: value }))} description="Show the donor name with donated books. Contact details remain private." />
        <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setDonorMode("EXISTING")} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-400 hover:text-white">Cancel</button><button type="button" onClick={createAndSelectDonor} disabled={creatingDonor} className="rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{creatingDonor ? "Creating…" : "Create and select donor"}</button></div>
      </div>}
    </section>
    <BookCategoryPicker value={form.categories} savedCategories={savedCategories} error={categoryError} onChange={(categories) => { set("categories", categories); setCategoryError(""); }} />
    <div className="grid gap-5 md:grid-cols-3">
      <AdminFormField type="select" label="Language" value={form.language} onChange={(value) => set("language", value)} options={options(BOOK_LANGUAGES)} required />
      <AdminFormField type="select" label="Condition" value={form.condition} onChange={(value) => set("condition", value)} options={options(BOOK_CONDITIONS)} required />
      <AdminFormField type="number" label="Price" value={form.price} onChange={(value) => set("price", value)} required />
      <AdminFormField type="select" label="Currency" value={form.currency} onChange={(value) => set("currency", value)} options={options(BOOK_CURRENCIES)} />
      <div className="rounded-xl border border-gray-700 bg-[#0f172a] px-4 py-3"><span className="text-xs text-gray-400">Total copies</span><strong className="mt-1 block text-white">{form.editions.reduce((total, edition) => total + edition.stockQuantity, 0)}</strong></div>
      <AdminFormField type="text" label="Shelf location (optional)" value={form.shelfLocation} onChange={(value) => set("shelfLocation", value)} />
    </div>
    <section className="rounded-2xl border border-gray-700/60 p-5">
      <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold text-white">Editions and copies</h2><p className="mt-1 text-xs text-gray-400">Use one row per edition. A separate cover is optional.</p></div><button type="button" onClick={() => set("editions", [...form.editions, { label: "", publicationYear: "", stockQuantity: 1, coverImageUrl: "" }])} className="rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white">Add edition</button></div>
      <div className="mt-5 space-y-5">{form.editions.map((edition, index) => <div key={edition.id || index} className="grid gap-4 rounded-xl bg-[#0f172a] p-4 md:grid-cols-[1fr_160px_160px_auto] md:items-end">
        <AdminFormField type="text" label="Edition name" value={edition.label} onChange={(value) => set("editions", form.editions.map((item, i) => i === index ? { ...item, label: value } : item))} placeholder={form.editions.length === 1 ? "Optional when there is only one" : "e.g. 2nd edition"} />
        <AdminFormField type="number" label="Edition year" value={edition.publicationYear} onChange={(value) => set("editions", form.editions.map((item, i) => i === index ? { ...item, publicationYear: value } : item))} />
        <AdminFormField type="number" label="Copies" value={edition.stockQuantity} onChange={(value) => set("editions", form.editions.map((item, i) => i === index ? { ...item, stockQuantity: Math.max(0, Number(value) || 0) } : item))} required />
        <button type="button" disabled={form.editions.length === 1} onClick={() => set("editions", form.editions.filter((_, i) => i !== index))} className="min-h-11 rounded-lg border border-red-500/40 px-3 text-sm text-red-300 disabled:opacity-30">Remove</button>
        <div className="md:col-span-4"><ImageUploader value={edition.coverImageUrl} onChange={(value) => set("editions", form.editions.map((item, i) => i === index ? { ...item, coverImageUrl: value } : item))} onRemove={() => set("editions", form.editions.map((item, i) => i === index ? { ...item, coverImageUrl: "" } : item))} folder="book-inventory/editions" label="Edition cover override (optional)" /></div>
      </div>)}</div>
    </section>
    <ImageUploader value={form.coverImageUrl} onChange={(value) => set("coverImageUrl", value)} onRemove={() => set("coverImageUrl", "")} folder="book-inventory" label="Book cover" />
    <div className="grid gap-5 md:grid-cols-2">
      <AdminFormField type="textarea" label="Description (English)" value={form.descriptionEn} onChange={(value) => set("descriptionEn", value)} rows={5} />
      <AdminFormField type="textarea" label="Description (Arabic)" value={form.descriptionAr} onChange={(value) => set("descriptionAr", value)} rows={5} />
    </div>
    <AdminFormField type="select" label="Inventory status" value={form.status} onChange={(value) => set("status", value)} options={options(BOOK_INVENTORY_STATUSES)} required />
    <AdminFormField type="toggle" label="Publish in the future catalogue" value={form.isPublished} onChange={(value) => set("isPublished", value)} description="Publishing requires an available copy and cover image." />
    <AdminFormField type="textarea" label="Internal notes (optional)" value={form.internalNotes} onChange={(value) => set("internalNotes", value)} rows={4} />
  </AdminFormPage>;
}
