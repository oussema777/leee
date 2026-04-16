"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import { ActiveBadge } from "../../components/StatusBadge";
import StatusBadge from "../../components/StatusBadge";
import AdminModal from "../../components/AdminModal";
import { useToast } from "../../components/AdminToast";
import { adminGet, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface Career {
  id: string;
  titleEn: string;
  slug: string;
  locationEn: string | null;
  type: string;
  deadline: string | null;
  isActive: boolean;
}

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full Time", PART_TIME: "Part Time", CONTRACT: "Contract",
  VOLUNTEER: "Volunteer", INTERNSHIP: "Internship",
};

export default function CareersPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Career | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Career>>(`/careers?page=${page}&search=${search}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load careers"); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/careers/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Career>[] = [
    { key: "titleEn", label: "Title", sortable: true },
    { key: "type", label: "Type", render: (item) => <StatusBadge label={typeLabels[item.type] || item.type} variant="info" /> },
    { key: "locationEn", label: "Location" },
    { key: "deadline", label: "Deadline", render: (item) => item.deadline ? new Date(item.deadline).toLocaleDateString() : "—" },
    { key: "isActive", label: "Status", render: (item) => <ActiveBadge isActive={item.isActive} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Careers</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/careers/applications"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            View Applications →
          </Link>
          <Link
            href="/admin/careers/new"
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            Add Position
          </Link>
        </div>
      </div>
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onEdit={(item) => router.push(`/admin/careers/${item.id}/edit`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Position" message={`Delete "${deleteTarget?.titleEn}"?`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
