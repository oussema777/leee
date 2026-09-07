"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/AdminToast";
import { adminGet, type PaginatedResponse } from "@/lib/admin-api";
import { BOOK_CATEGORIES, BOOK_INVENTORY_STATUSES } from "@/lib/book-inventory/validation";

interface BookInventory { id: string; sku: string; title: string; author: string; category: string; language: string; condition: string; priceCents: number; currency: string; stockQuantity: number; coverImageUrl: string | null; status: string; isPublished: boolean; updatedAt: string; }
const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const options = (values: readonly string[]) => values.map((value) => ({ value, label: humanize(value) }));
const variant = (status: string): "success" | "warning" | "neutral" => status === "AVAILABLE" ? "success" : status === "ARCHIVED" ? "neutral" : "warning";

export default function BookInventoryPage() {
  const router = useRouter(); const toast = useToast();
  const [data, setData] = useState<BookInventory[]>([]); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [category, setCategory] = useState("");
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), search }); if (status) params.set("status", status); if (category) params.set("category", category);
      const result = await adminGet<PaginatedResponse<BookInventory>>("/book-inventory?" + params);
      setData(result.data); setTotal(result.pagination.total); setTotalPages(result.pagination.totalPages);
    } catch { toast.error("Failed to load inventory"); } finally { setLoading(false); }
  }, [page, search, status, category, toast]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const columns: Column<BookInventory>[] = [
    { key: "title", label: "Book", render: (item) => <div className="flex items-center gap-3 min-w-[220px]">{item.coverImageUrl ? <img src={item.coverImageUrl} alt="" className="h-12 w-9 rounded object-cover" /> : <div className="h-12 w-9 rounded bg-gray-700" />}<div><p className="font-medium text-white">{item.title}</p><p className="text-xs text-gray-500">{item.author}</p></div></div> },
    { key: "sku", label: "SKU" },
    { key: "category", label: "Category", render: (item) => humanize(item.category) },
    { key: "priceCents", label: "Price", render: (item) => `${(item.priceCents / 100).toFixed(2)} ${item.currency}` },
    { key: "stockQuantity", label: "Stock" },
    { key: "status", label: "Status", render: (item) => <StatusBadge label={humanize(item.status)} variant={variant(item.status)} /> },
    { key: "isPublished", label: "Published", render: (item) => <StatusBadge label={item.isPublished ? "Live" : "Draft"} variant={item.isPublished ? "success" : "neutral"} /> },
  ];
  return <div>
    <AdminPageHeader title="Book Inventory" actionLabel="Add Book" actionHref="/admin/book-inventory/new" />
    <div className="mb-4 flex flex-wrap gap-3">
      <label className="sr-only" htmlFor="inventory-status">Filter by status</label><select id="inventory-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700/50 bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All statuses</option>{options(BOOK_INVENTORY_STATUSES).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <label className="sr-only" htmlFor="inventory-category">Filter by category</label><select id="inventory-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700/50 bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All categories</option>{options(BOOK_CATEGORIES).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
    </div>
    <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} onPageChange={setPage} onEdit={(item) => router.push(`/admin/book-inventory/${item.id}/edit`)} loading={loading} />
  </div>;
}
