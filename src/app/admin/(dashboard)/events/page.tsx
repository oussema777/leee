"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import { ActiveBadge } from "../../components/StatusBadge";
import StatusBadge from "../../components/StatusBadge";
import AdminModal from "../../components/AdminModal";
import { useToast } from "../../components/AdminToast";
import { adminGet, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface Event {
  id: string;
  titleEn: string;
  slug: string;
  startDate: string;
  location: string | null;
  isActive: boolean;
  isFeatured: boolean;
}

export default function EventsPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Event>>(`/events?page=${page}&search=${search}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load events"); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/events/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Event>[] = [
    { key: "titleEn", label: "Title", sortable: true },
    { key: "startDate", label: "Date", sortable: true, render: (item) => new Date(item.startDate).toLocaleDateString() },
    { key: "location", label: "Location" },
    { key: "isFeatured", label: "Featured", render: (item) => item.isFeatured ? <StatusBadge label="Featured" variant="info" /> : null },
    { key: "isActive", label: "Status", render: (item) => <ActiveBadge isActive={item.isActive} /> },
  ];

  return (
    <div>
      <AdminPageHeader title="Events" actionLabel="Add Event" actionHref="/admin/events/new" />
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onEdit={(item) => router.push(`/admin/events/${item.id}/edit`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Event" message={`Delete "${deleteTarget?.titleEn}"?`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
