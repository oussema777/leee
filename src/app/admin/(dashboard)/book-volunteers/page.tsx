"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/AdminToast";
import { adminGet, type PaginatedResponse } from "@/lib/admin-api";
import { BOOK_VOLUNTEER_STATUSES } from "@/lib/book-restore/volunteer";

type Status = (typeof BOOK_VOLUNTEER_STATUSES)[number];
type Volunteer = { id: string; reference: string; fullName: string; governorate: string; area: string; interests: string[]; availability: string; status: Status; isRead: boolean; createdAt: string };
const human = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, char => char.toUpperCase());
export default function BookVolunteersPage() {
  const router = useRouter(); const toast = useToast();
  const [items, setItems] = useState<Volunteer[]>([]); const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), search }); if (status) params.set("status", status);
      const result = await adminGet<PaginatedResponse<Volunteer>>(`/book-volunteers?${params}`);
      setItems(result.data); setTotal(result.pagination.total); setTotalPages(result.pagination.totalPages);
    } catch { toast.error("Could not load volunteer applications"); }
    finally { setLoading(false); }
  }, [page, search, status, toast]);
  useEffect(() => { void load(); }, [load]);
  const columns: Column<Volunteer>[] = [
    { key: "reference", label: "Reference", render: item => <span className={item.isRead ? "text-gray-300" : "font-semibold text-white"}>{!item.isRead && <span className="me-2 inline-block size-2 rounded-full bg-brand-blue" />}{item.reference}</span> },
    { key: "fullName", label: "Volunteer", sortable: true },
    { key: "area", label: "Location", render: item => `${item.area}, ${human(item.governorate)}` },
    { key: "interests", label: "Can help with", render: item => item.interests.map(human).join(", ") },
    { key: "availability", label: "Availability", render: item => human(item.availability) },
    { key: "status", label: "Status", render: item => <StatusBadge label={human(item.status)} variant={item.status === "ONBOARDED" ? "success" : item.status === "DECLINED" ? "neutral" : item.status === "CONTACTED" ? "warning" : "info"} /> },
    { key: "createdAt", label: "Submitted", sortable: true, render: item => new Date(item.createdAt).toLocaleDateString() },
  ];
  return <div><AdminPageHeader title="Book Restore Volunteers" />
    <div className="mb-4"><label htmlFor="volunteer-status" className="sr-only">Filter by status</label><select id="volunteer-status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700 bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All statuses</option>{BOOK_VOLUNTEER_STATUSES.map(value => <option key={value} value={value}>{human(value)}</option>)}</select></div>
    <AdminDataTable columns={columns} data={items} totalPages={totalPages} currentPage={page} total={total} search={search} onSearch={value => { setSearch(value); setPage(1); }} onPageChange={setPage} onView={item => router.push(`/admin/book-volunteers/${item.id}`)} loading={loading} />
  </div>;
}
