"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import AdminPageHeader from "../../components/AdminPageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/AdminToast";
import { adminGet, type PaginatedResponse } from "@/lib/admin-api";
import { BOOK_DONATION_STATUSES } from "@/lib/book-restore/validation";

type Status = (typeof BOOK_DONATION_STATUSES)[number];
interface Donation {
  id: string;
  reference: string;
  fullName: string;
  governorate: string;
  estimatedQuantity: string;
  handoverMethod: string;
  status: Status;
  isRead: boolean;
  createdAt: string;
}

const variant = (status: Status): "info" | "warning" | "success" | "danger" | "neutral" => {
  if (["ACCEPTED", "COLLECTED", "RECEIVED"].includes(status)) return "success";
  if (["REJECTED"].includes(status)) return "danger";
  if (["NEEDS_FOLLOW_UP", "PICKUP_TO_SCHEDULE", "SCHEDULED", "UNDER_REVIEW"].includes(status)) return "warning";
  if (status === "NEW") return "info";
  return "neutral";
};

const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

export default function BookDonationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), search });
      if (status) params.set("status", status);
      const result = await adminGet<PaginatedResponse<Donation>>(`/book-donations?${params}`);
      setData(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch {
      toast.error("Failed to load book donations");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, toast]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<Donation>[] = [
    { key: "reference", label: "Reference", render: (item) => <span className={item.isRead ? "font-medium text-gray-300" : "font-semibold text-white"}>{!item.isRead && <span className="me-2 inline-block size-2 rounded-full bg-brand-blue" />}{item.reference}</span> },
    { key: "fullName", label: "Donor", sortable: true },
    { key: "governorate", label: "Governorate", render: (item) => humanize(item.governorate) },
    { key: "estimatedQuantity", label: "Quantity", render: (item) => humanize(item.estimatedQuantity) },
    { key: "handoverMethod", label: "Handover", render: (item) => humanize(item.handoverMethod) },
    { key: "status", label: "Status", render: (item) => <StatusBadge label={humanize(item.status)} variant={variant(item.status)} /> },
    { key: "createdAt", label: "Submitted", sortable: true, render: (item) => new Date(item.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <AdminPageHeader title="Book Donations" />
      <div className="mb-4">
        <label htmlFor="donation-status" className="sr-only">Filter by status</label>
        <select id="donation-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700/50 bg-[#1e293b] px-3 py-2.5 text-sm text-white focus:border-brand-blue focus:outline-none">
          <option value="">All statuses</option>
          {BOOK_DONATION_STATUSES.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
        </select>
      </div>
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} onPageChange={setPage} onView={(item) => router.push(`/admin/book-donations/${item.id}`)} loading={loading} />
    </div>
  );
}
