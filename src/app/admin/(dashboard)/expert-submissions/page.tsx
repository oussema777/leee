"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/AdminToast";
import { adminGet, type PaginatedResponse } from "@/lib/admin-api";

interface Submission {
  id: string;
  fullName: string;
  professionalTitle: string;
  countries: string[];
  expertiseKeywords: string;
  photoUrl: string | null;
  status: "NEW" | "SHORTLISTED" | "CONTACTED" | "ARCHIVED" | "REJECTED";
  isRead: boolean;
  createdAt: string;
}

const STATUS_VARIANT = {
  NEW: "info",
  SHORTLISTED: "warning",
  CONTACTED: "success",
  ARCHIVED: "neutral",
  REJECTED: "danger",
} as const;

export default function ExpertSubmissionsPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), search });
      if (statusFilter) params.set("status", statusFilter);
      const res = await adminGet<PaginatedResponse<Submission>>(`/expert-submissions?${params}`);
      setData(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<Submission>[] = [
    {
      key: "photoUrl",
      label: "Photo",
      render: (item) =>
        item.photoUrl ? (
          <img src={item.photoUrl} alt={item.fullName} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs font-semibold">
            {item.fullName[0]?.toUpperCase() ?? "?"}
          </div>
        ),
    },
    {
      key: "fullName",
      label: "Name",
      sortable: true,
      render: (item) => (
        <span className={item.isRead ? "text-gray-300" : "text-white font-semibold"}>
          {!item.isRead && <span className="inline-block w-2 h-2 bg-brand-blue rounded-full mr-2" />}
          {item.fullName}
        </span>
      ),
    },
    { key: "professionalTitle", label: "Title" },
    {
      key: "countries",
      label: "Country",
      render: (item) => <span>{item.countries[0] ?? "—"}</span>,
    },
    {
      key: "expertiseKeywords",
      label: "Expertise",
      render: (item) => <span className="line-clamp-1 max-w-xs">{item.expertiseKeywords}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge label={item.status} variant={STATUS_VARIANT[item.status]} />,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Expert Applications" />
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-[#1e293b] border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-brand-blue"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="CONTACTED">Contacted</option>
          <option value="ARCHIVED">Archived</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <AdminDataTable
        columns={columns}
        data={data}
        totalPages={totalPages}
        currentPage={page}
        total={total}
        search={search}
        onSearch={(s) => {
          setSearch(s);
          setPage(1);
        }}
        onPageChange={setPage}
        onView={(item) => router.push(`/admin/expert-submissions/${item.id}`)}
        loading={loading}
      />
    </div>
  );
}
