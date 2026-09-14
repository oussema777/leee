"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import AdminModal from "../../components/AdminModal";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/AdminToast";
import { adminDelete, adminGet, type PaginatedResponse } from "@/lib/admin-api";
import { BOOK_INVENTORY_STATUSES } from "@/lib/book-inventory/validation";
import { bookCategoryLabel, getBookCategories, getBookCategoryOptions } from "@/lib/book-inventory/categories";

interface BookInventory { id: string; sku: string; title: string; author: string; editions: { id: string; label: string | null }[]; category: string; customCategory: string | null; categories: string[]; language: string; condition: string; priceCents: number; currency: string; stockQuantity: number; coverImageUrl: string | null; status: string; isPublished: boolean; donor: { displayName: string; type: string; logoUrl: string | null; logoApproved: boolean } | null; updatedAt: string; }
const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const options = (values: readonly string[]) => values.map((value) => ({ value, label: humanize(value) }));
const variant = (status: string): "success" | "warning" | "neutral" => status === "AVAILABLE" ? "success" : status === "ARCHIVED" ? "neutral" : "warning";

export default function BookInventoryPage() {
  const router = useRouter(); const toast = useToast();
  const [data, setData] = useState<BookInventory[]>([]); const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [category, setCategory] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>(() => getBookCategoryOptions());
  const [deleteTarget, setDeleteTarget] = useState<BookInventory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  useEffect(() => {
    adminGet<{ data: string[] }>("/book-inventory/categories")
      .then((result) => setCategoryOptions(getBookCategoryOptions(result.data)))
      .catch(() => undefined);
  }, []);
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({ page: String(page), search }); if (status) params.set("status", status); if (category) params.set("category", category);
      const result = await adminGet<PaginatedResponse<BookInventory>>("/book-inventory?" + params);
      setData(result.data); setTotal(result.pagination.total); setTotalPages(result.pagination.totalPages);
    } catch {
      setLoadError("We couldn't load the inventory. Please try again.");
    } finally { setLoading(false); }
  }, [page, search, status, category]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await adminDelete(`/book-inventory/${deleteTarget.id}`);
      setDeleteTarget(null);
      toast.success("Book deleted");
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchData();
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete book. Please try again.");
    } finally {
      setDeleting(false);
    }
  };
  const columns: Column<BookInventory>[] = [
    { key: "title", label: "Book", render: (item) => <div className="flex items-center gap-3 min-w-[220px]">{item.coverImageUrl ? <img src={item.coverImageUrl} alt="" className="h-12 w-9 rounded object-cover" /> : <div className="h-12 w-9 rounded bg-gray-700" />}<div><p className="font-medium text-white">{item.title}</p><p className="text-xs text-gray-500">{item.author} · {item.editions.length} {item.editions.length === 1 ? "edition" : "editions"}</p></div></div> },
    { key: "sku", label: "SKU" },
    { key: "donor", label: "Donated by", render: (item) => item.donor ? <div className="flex min-w-32 items-center gap-2">{item.donor.logoUrl && item.donor.logoApproved && <img src={item.donor.logoUrl} alt="" className="size-7 rounded bg-white object-contain p-0.5" />}<span>{item.donor.displayName}</span></div> : <span className="text-gray-500">Not recorded</span> },
    { key: "categories", label: "Categories", render: (item) => <div className="flex min-w-40 max-w-64 flex-wrap gap-1.5">{getBookCategories(item).map((category) => <span key={category} className="max-w-full break-words rounded-md bg-brand-blue/15 px-2 py-1 text-xs text-blue-200">{bookCategoryLabel(category)}</span>)}</div> },
    { key: "priceCents", label: "Price", render: (item) => `${(item.priceCents / 100).toFixed(2)} ${item.currency}` },
    { key: "stockQuantity", label: "Stock" },
    { key: "status", label: "Status", render: (item) => <StatusBadge label={humanize(item.status)} variant={variant(item.status)} /> },
    { key: "isPublished", label: "Published", render: (item) => <StatusBadge label={item.isPublished ? "Live" : "Draft"} variant={item.isPublished ? "success" : "neutral"} /> },
  ];
  return <div>
    <AdminPageHeader title="Book Inventory" actionLabel="Add Book" actionHref="/admin/book-inventory/new" />
    <div className="mb-4 flex flex-wrap gap-3">
      <label className="sr-only" htmlFor="inventory-status">Filter by status</label><select id="inventory-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700/50 bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All statuses</option>{options(BOOK_INVENTORY_STATUSES).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <label className="sr-only" htmlFor="inventory-category">Filter by category</label><select id="inventory-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700/50 bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All categories</option>{categoryOptions.map((value) => <option key={value} value={value}>{bookCategoryLabel(value)}</option>)}</select>
    </div>
    {loadError ? (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-400/30 bg-[#1e293b] p-6">
        <p className="text-sm text-red-200">{loadError}</p>
        <button type="button" onClick={fetchData} className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90">Retry</button>
      </div>
    ) : (
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} onPageChange={setPage} onEdit={(item) => router.push(`/admin/book-inventory/${item.id}/edit`)} onDelete={(item) => { setDeleteError(""); setDeleteTarget(item); }} loading={loading} />
    )}
    <AdminModal
      isOpen={!!deleteTarget}
      onClose={() => { if (!deleting) setDeleteTarget(null); }}
      onConfirm={handleDelete}
      title="Delete book?"
      message={`Permanently delete "${deleteTarget?.title ?? ""}"${deleteTarget?.sku ? ` (${deleteTarget.sku})` : ""} from inventory and the catalogue? This cannot be undone.`}
      confirmLabel="Delete book"
      loading={deleting}
      loadingLabel="Deleting..."
      error={deleteError}
    />
  </div>;
}
