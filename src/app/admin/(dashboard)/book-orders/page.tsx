"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/AdminToast";
import { adminGet, type PaginatedResponse } from "@/lib/admin-api";

interface OrderRow { id: string; reference: string; customerName: string; customerPhone: string; purpose: string; requestedBookCount: number; priceCents: number; paymentStatus: string; status: string; isRead: boolean; createdAt: string; }
const statuses = ["NEW", "CONFIRMED", "PREPARING", "READY", "DISPATCHED", "COMPLETED", "CANCELLED"];
const purposes = ["SELF", "GIFT", "DONATION"];
const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

export default function BookOrdersPage() {
  const router = useRouter(); const toast = useToast();
  const [data, setData] = useState<OrderRow[]>([]); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [purpose, setPurpose] = useState("");
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), search }); if (status) params.set("status", status); if (purpose) params.set("purpose", purpose);
      const result = await adminGet<PaginatedResponse<OrderRow>>(`/book-orders?${params}`);
      setData(result.data); setTotal(result.pagination.total); setTotalPages(result.pagination.totalPages);
    } catch { toast.error("Failed to load book orders"); } finally { setLoading(false); }
  }, [page, purpose, search, status, toast]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const columns: Column<OrderRow>[] = [
    { key: "reference", label: "Order", render: (item) => <div><p className="font-semibold text-white">{item.reference}</p><p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p></div> },
    { key: "customerName", label: "Customer", render: (item) => <div><p className={item.isRead ? "text-gray-300" : "font-semibold text-white"}>{item.customerName}</p><p className="text-xs text-gray-500">{item.customerPhone}</p></div> },
    { key: "purpose", label: "Purpose", render: (item) => humanize(item.purpose) },
    { key: "requestedBookCount", label: "Books" },
    { key: "priceCents", label: "Total", render: (item) => `$${item.priceCents / 100}` },
    { key: "paymentStatus", label: "Payment", render: (item) => <StatusBadge label={humanize(item.paymentStatus)} variant={item.paymentStatus === "PAID" ? "success" : "warning"} /> },
    { key: "status", label: "Status", render: (item) => <StatusBadge label={humanize(item.status)} variant={item.status === "COMPLETED" ? "success" : item.status === "CANCELLED" ? "neutral" : "warning"} /> },
  ];
  return <div><AdminPageHeader title="Book Orders" /><div className="mb-4 flex flex-wrap gap-3"><select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700/50 bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select><select aria-label="Filter by purpose" value={purpose} onChange={(event) => { setPurpose(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700/50 bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All purposes</option>{purposes.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select></div><AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} onPageChange={setPage} onView={(item) => router.push(`/admin/book-orders/${item.id}`)} loading={loading} /></div>;
}

