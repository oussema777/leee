"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import StatusBadge from "../../components/StatusBadge";
import AdminModal from "../../components/AdminModal";
import { useToast } from "../../components/AdminToast";
import { adminGet, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface Submission {
  id: string;
  fullName: string;
  program: string | null;
  quote: string;
  consent: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isRead: boolean;
  createdAt: string;
}

const STATUS_VARIANT = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" } as const;

export default function TestimonialSubmissionsPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Submission>>(`/testimonial-submissions?page=${page}&search=${search}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load submissions"); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/testimonial-submissions/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Submission>[] = [
    { key: "fullName", label: "Name", sortable: true, render: (item) => (
      <span className={item.isRead ? "text-gray-300" : "text-white font-semibold"}>
        {!item.isRead && <span className="inline-block w-2 h-2 bg-brand-blue rounded-full mr-2" />}
        {item.fullName}
      </span>
    )},
    { key: "program", label: "Program" },
    { key: "quote", label: "Quote", render: (item) => <span className="line-clamp-2 max-w-xs">{item.quote}</span> },
    { key: "consent", label: "Consent", render: (item) => (
      <StatusBadge label={item.consent ? "Yes" : "No"} variant={item.consent ? "success" : "danger"} />
    )},
    { key: "status", label: "Status", render: (item) => (
      <StatusBadge label={item.status} variant={STATUS_VARIANT[item.status]} />
    )},
    { key: "createdAt", label: "Date", sortable: true, render: (item) => new Date(item.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <AdminPageHeader title="Testimonial Submissions" />
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onView={(item) => router.push(`/admin/testimonial-submissions/${item.id}`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Submission" message={`Delete submission from "${deleteTarget?.fullName}"? This cannot be undone.`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
