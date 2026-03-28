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

interface Program {
  id: string;
  titleEn: string;
  slug: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  pillar: { titleEn: string } | null;
  createdAt: string;
}

const statusVariant: Record<string, "success" | "info" | "warning"> = {
  ACTIVE: "success", COMPLETED: "neutral" as any, UPCOMING: "info",
};

export default function ProgramsPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Program>>(`/programs?page=${page}&search=${search}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load programs"); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/programs/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Program>[] = [
    { key: "titleEn", label: "Title", sortable: true },
    { key: "pillar", label: "Pillar", render: (item) => item.pillar?.titleEn || "—" },
    { key: "status", label: "Status", render: (item) => <StatusBadge label={item.status} variant={statusVariant[item.status] || "neutral"} /> },
    { key: "isFeatured", label: "Featured", render: (item) => item.isFeatured ? <StatusBadge label="Featured" variant="info" /> : null },
    { key: "isActive", label: "Active", render: (item) => <ActiveBadge isActive={item.isActive} /> },
  ];

  return (
    <div>
      <AdminPageHeader title="Programs" actionLabel="Add Program" actionHref="/admin/programs/new" />
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onEdit={(item) => router.push(`/admin/programs/${item.id}/edit`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Program" message={`Delete "${deleteTarget?.titleEn}"? This will also delete all related images, team members, partners, stats, and videos.`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
