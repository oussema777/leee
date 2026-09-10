"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormPage from "../../../components/AdminFormPage";
import AdminFormField from "../../../components/AdminFormField";
import ImageUploader from "../../../components/ImageUploader";
import { useToast } from "../../../components/AdminToast";
import { adminPost, adminPut } from "@/lib/admin-api";
import { BOOK_CATEGORIES, BOOK_CONDITIONS, BOOK_CURRENCIES, BOOK_INVENTORY_STATUSES, BOOK_LANGUAGES } from "@/lib/book-inventory/validation";

import { useEffect, useMemo } from 'react';
import { adminGet } from '@/lib/admin-api';

interface BookFormData {
  id?: string; sku: string; title: string; titleAr: string; author: string; authorAr: string;
  descriptionEn: string; descriptionAr: string; isbn: string; publisher: string; publicationYear: string;
  category: string; customCategory: string; language: string; condition: string; price: string; currency: string;
  stockQuantity: number; shelfLocation: string; coverImageUrl: string; status: string; isPublished: boolean; internalNotes: string;
}

const empty: BookFormData = { sku: "", title: "", titleAr: "", author: "", authorAr: "", descriptionEn: "", descriptionAr: "", isbn: "", publisher: "", publicationYear: "", category: "FICTION", customCategory: "", language: "ARABIC", condition: "GOOD", price: "5", currency: "USD", stockQuantity: 1, shelfLocation: "", coverImageUrl: "", status: "AVAILABLE", isPublished: false, internalNotes: "" };
const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const options = (values: readonly string[]) => values.map((value) => ({ value, label: humanize(value) }));
const newBookDefaults = { ...empty, price: '5', customCategory: '' };

function toForm(initial?: Partial<BookFormData> & { priceCents?: number; publicationYear?: number | null }) {
  if (!initial) return newBookDefaults;
  const populatedFields = Object.fromEntries(Object.entries(initial).filter(([, value]) => value != null));
  return { ...empty, ...populatedFields, price: initial.priceCents == null ? "0" : String(initial.priceCents / 100), publicationYear: initial.publicationYear == null ? "" : String(initial.publicationYear) } as BookFormData;
}

export default function BookInventoryForm({ initial }: { initial?: Partial<BookFormData> & { priceCents?: number; publicationYear?: number | null } }) {
  const router = useRouter(); const toast = useToast();
  const [form, setForm] = useState<BookFormData>(() => toForm(initial)); const [loading, setLoading] = useState(false);
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const set = <K extends keyof BookFormData>(key: K, value: BookFormData[K]) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    adminGet<{ data: string[] }>('/book-inventory/categories')
      .then((result) => setSavedCategories(result.data))
      .catch(() => undefined);
  }, []);
  const categoryChoices = useMemo(() => {
    const query = categorySearch.trim().toLocaleLowerCase();
    const standard = options(BOOK_CATEGORIES);
    const custom = savedCategories.map((label) => ({ value: 'CUSTOM:' + label, label }));
    return [...standard, ...custom].filter((option) => !query || option.label.toLocaleLowerCase().includes(query));
  }, [categorySearch, savedCategories]);
  const categoryChoice = form.category === 'OTHER' && form.customCategory
    ? 'CUSTOM:' + form.customCategory
    : form.category;
  const chooseCategory = (value: string) => {
    if (value.startsWith('CUSTOM:')) {
      setForm((current) => ({ ...current, category: 'OTHER', customCategory: value.slice(7) }));
    } else {
      setForm((current) => ({ ...current, category: value, customCategory: value === 'OTHER' ? current.customCategory : '' }));
    }
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, priceCents: Math.round(Math.max(0, Number(form.price) || 0) * 100), publicationYear: form.publicationYear || undefined };
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
      <AdminFormField type="number" label="Publication year (optional)" value={form.publicationYear} onChange={(value) => set("publicationYear", value)} />
    </div>
    <div className="grid gap-5 md:grid-cols-3">
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400" htmlFor="book-category-search">Category <span className="text-red-400">*</span></label>
        <input id="book-category-search" type="search" value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder="Search categories…" className="w-full rounded-xl border border-gray-700/50 bg-[#0f172a] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none" />
        <select value={categoryChoice} onChange={(event) => chooseCategory(event.target.value)} required className="w-full rounded-xl border border-gray-700/50 bg-[#0f172a] px-4 py-2.5 text-sm text-white focus:border-brand-blue focus:outline-none">
          {categoryChoices.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {form.category === "OTHER" && <input value={form.customCategory} onChange={(event) => set("customCategory", event.target.value)} required maxLength={80} placeholder="Type the new category name" className="w-full rounded-xl border border-brand-blue/50 bg-[#0f172a] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none" />}
        <p className="text-xs text-gray-500">Choose Other to add a category. It will be available for future books after saving.</p>
      </div>
      <AdminFormField type="select" label="Language" value={form.language} onChange={(value) => set("language", value)} options={options(BOOK_LANGUAGES)} required />
      <AdminFormField type="select" label="Condition" value={form.condition} onChange={(value) => set("condition", value)} options={options(BOOK_CONDITIONS)} required />
      <AdminFormField type="number" label="Price" value={form.price} onChange={(value) => set("price", value)} required />
      <AdminFormField type="select" label="Currency" value={form.currency} onChange={(value) => set("currency", value)} options={options(BOOK_CURRENCIES)} />
      <AdminFormField type="number" label="Copies in stock" value={form.stockQuantity} onChange={(value) => {
        const stockQuantity = Number(value) || 0;
        setForm((current) => ({
          ...current,
          stockQuantity,
          status: current.status === "RESERVED" && stockQuantity > 0 ? "AVAILABLE" : current.status,
        }));
      }} required />
      <AdminFormField type="text" label="Shelf location (optional)" value={form.shelfLocation} onChange={(value) => set("shelfLocation", value)} />
    </div>
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
