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

interface Member {
  id: string;
  nameEn: string;
  titleEn: string;
  memberType: string;
  order: number;
  isActive: boolean;
  imageUrl: string | null;
}

export default function MembersPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Member>>(`/members?page=${page}&search=${search}${typeFilter ? `&type=${typeFilter}` : ""}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load members"); }
    finally { setLoading(false); }
  }, [page, search, typeFilter, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/members/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Member>[] = [
    { key: "imageUrl", label: "Photo", render: (item) => item.imageUrl ? <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-gray-700" /> },
    { key: "nameEn", label: "Name", sortable: true },
    { key: "titleEn", label: "Title" },
    { key: "memberType", label: "Type", render: (item) => {
      const typeMeta: Record<string, { label: string; variant: "info" | "success" | "warning" | "neutral" }> = {
        BOARD: { label: "Board", variant: "info" },
        TEAM: { label: "Team", variant: "success" },
        EXPERT: { label: "Expert", variant: "warning" },
        MENTOR: { label: "Mentor", variant: "neutral" },
      };
      const meta = typeMeta[item.memberType] ?? { label: item.memberType, variant: "neutral" as const };
      return <StatusBadge label={meta.label} variant={meta.variant} />;
    } },
    { key: "order", label: "Order", sortable: true },
    { key: "isActive", label: "Status", render: (item) => <ActiveBadge isActive={item.isActive} /> },
  ];

  return (
    <div>
      <AdminPageHeader title="Board & Team" actionLabel="Add Member" actionHref="/admin/members/new" />
      <div className="flex gap-2 mb-4">
        {["", "BOARD", "TEAM", "EXPERT", "MENTOR"].map((t) => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === t ? "bg-brand-blue text-white" : "bg-[#1e293b] text-gray-400 hover:text-white"}`}
          >
            {t || "All"}
          </button>
        ))}
      </div>
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onEdit={(item) => router.push(`/admin/members/${item.id}/edit`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Member" message={`Delete "${deleteTarget?.nameEn}"?`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
