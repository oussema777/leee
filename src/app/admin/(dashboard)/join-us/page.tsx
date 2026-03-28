"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import { ReadBadge } from "../../components/StatusBadge";
import AdminModal from "../../components/AdminModal";
import { useToast } from "../../components/AdminToast";
import { adminGet, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface JoinUs {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  interestArea: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function JoinUsPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<JoinUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<JoinUs | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<JoinUs>>(`/join-us?page=${page}&search=${search}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load submissions"); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/join-us/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<JoinUs>[] = [
    { key: "firstName", label: "Name", render: (item) => (
      <span className={item.isRead ? "text-gray-300" : "text-white font-semibold"}>
        {!item.isRead && <span className="inline-block w-2 h-2 bg-brand-blue rounded-full mr-2" />}
        {item.firstName} {item.lastName}
      </span>
    )},
    { key: "email", label: "Email" },
    { key: "interestArea", label: "Interest" },
    { key: "isRead", label: "Status", render: (item) => <ReadBadge isRead={item.isRead} /> },
    { key: "createdAt", label: "Date", sortable: true, render: (item) => new Date(item.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <AdminPageHeader title="Join Us Applications" />
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onView={(item) => router.push(`/admin/join-us/${item.id}`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Application" message={`Delete application from "${deleteTarget?.firstName} ${deleteTarget?.lastName}"?`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
