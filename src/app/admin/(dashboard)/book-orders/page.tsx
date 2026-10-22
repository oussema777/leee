"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/AdminToast";
import { adminGet, type PaginatedResponse } from "@/lib/admin-api";

interface OrderRow { paymentMethod: string; whishPayment: { state: string; submittedAt: string | null } | null; id: string; reference: string; customerName: string; customerPhone: string; purpose: string; requestedBookCount: number; priceCents: number; paymentStatus: string; status: string; isRead: boolean; createdAt: string; }
const statuses = ["NEW", "CONFIRMED", "PREPARING", "READY", "DISPATCHED", "COMPLETED", "CANCELLED"];
const paymentStates = ["AWAITING_PAYMENT", "UNDER_REVIEW", "CHANGES_REQUESTED", "VERIFIED", "EXPIRED", "CANCELLED", "REFUNDED"];
const purposes = ["SELF", "GIFT", "DONATION"];
const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
function statusVariant(state: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (["PAID", "VERIFIED", "COMPLETED"].includes(state)) return "success";
  if (["FAILED", "CANCELLED"].includes(state)) return "danger";
  if (["CONFIRMED", "PREPARING", "READY", "DISPATCHED", "UNDER_REVIEW"].includes(state)) return "info";
  if (["NEW", "PENDING", "AWAITING_PAYMENT", "CHANGES_REQUESTED"].includes(state)) return "warning";
  return "neutral";
}

export default function BookOrdersPage() {
  const router = useRouter(); const toast = useToast();
  const [pageSize, setPageSize] = useState(20);
  const requestId = useRef(0);
  const [data, setData] = useState<OrderRow[]>([]); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [purpose, setPurpose] = useState("");
  const [paymentState, setPaymentState] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const fetchData = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize), search }); if (status) params.set("status", status); if (purpose) params.set("purpose", purpose);
      if (paymentState) params.set("paymentState", paymentState); if (paymentMethod) params.set("paymentMethod", paymentMethod);
      const result = await adminGet<PaginatedResponse<OrderRow>>(`/book-orders?${params}`);
      if (currentRequest !== requestId.current) return;
      if (page > Math.max(1, result.pagination.totalPages)) { setPage(Math.max(1, result.pagination.totalPages)); return; }
      setData(result.data); setTotal(result.pagination.total); setTotalPages(result.pagination.totalPages);
    } catch { if (currentRequest === requestId.current) toast.error("Failed to load book orders"); } finally { if (currentRequest === requestId.current) setLoading(false); }
  }, [pageSize, page, purpose, search, status, toast, paymentState, paymentMethod]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const columns: Column<OrderRow>[] = [
    { key: "reference", label: "Order", render: (item) => <div><p className="font-semibold text-white">{item.reference}</p><p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p></div> },
    { key: "customerName", label: "Customer", render: (item) => <div><p className={item.isRead ? "text-gray-300" : "font-semibold text-white"}>{item.customerName}</p><p className="text-xs text-gray-500">{item.customerPhone}</p></div> },
    { key: "paymentMethod", label: "Method", render: (item) => humanize(item.paymentMethod) },
    { key: "purpose", label: "Purpose", render: (item) => humanize(item.purpose) },
    { key: "requestedBookCount", label: "Books" },
    { key: "priceCents", label: "Total", render: (item) => `$${item.priceCents / 100}` },
    { key: "paymentStatus", label: "Payment", render: (item) => <StatusBadge label={humanize(item.whishPayment?.state || item.paymentStatus)} variant={statusVariant(item.whishPayment?.state || item.paymentStatus)} /> },
    { key: "status", label: "Status", render: (item) => <StatusBadge label={humanize(item.status)} variant={statusVariant(item.status)} /> },
  ];
  return <div><AdminPageHeader title="Book Orders" /><a href="/admin/book-orders/tracking-inbox" className="mb-5 me-5 inline-block text-sm font-semibold text-brand-blue underline">Unmatched tracking updates</a><a href="/admin/book-whish" className="mb-5 inline-block text-sm font-semibold text-brand-blue underline">Whish payment setup</a><a href="/admin/book-bank-audi" className="mb-5 ms-5 inline-block text-sm font-semibold text-brand-blue underline">Bank Audi setup</a><div className="mb-4 flex flex-wrap gap-3"><select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700/50 bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select><select aria-label="Filter by purpose" value={purpose} onChange={(event) => { setPurpose(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700/50 bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All purposes</option>{purposes.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select><select aria-label="Filter payment method" value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setPage(1); }} className="rounded-xl bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All payment methods</option><option value="WHISH">Whish</option><option value="BANK_AUDI">Bank Audi</option><option value="CASH_ON_DELIVERY">Cash on delivery / pickup</option><option value="CASH_ARRANGEMENT">Cash arrangement</option></select><select aria-label="Filter payment verification" value={paymentState} onChange={e => { setPaymentState(e.target.value); setPage(1); }} className="rounded-xl bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All verification states</option>{paymentStates.map(value => <option key={value} value={value}>{humanize(value)}</option>)}</select></div><AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} pageSize={pageSize} onPageSizeChange={value => { setPageSize(value); setPage(1); }} onPageChange={setPage} onView={(item) => router.push(`/admin/book-orders/${item.id}`)} loading={loading} /></div>;
}

