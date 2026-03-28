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

interface Partner {
  id: string;
  nameEn: string;
  logoUrl: string;
  websiteUrl: string | null;
  type: string;
  order: number;
  isActive: boolean;
}

const typeVariant: Record<string, "info" | "success" | "warning" | "danger"> = {
  PARTNER: "info", CLIENT: "success", DONOR: "warning", CRISIS_PARTNER: "danger",
};

export default function PartnersPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Partner>>(`/partners?page=${page}&search=${search}${typeFilter ? `&type=${typeFilter}` : ""}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load partners"); }
    finally { setLoading(false); }
  }, [page, search, typeFilter, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/partners/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Partner>[] = [
    { key: "logoUrl", label: "Logo", render: (item) => <img src={item.logoUrl} alt="" className="h-10 w-auto object-contain" /> },
    { key: "nameEn", label: "Name", sortable: true },
    { key: "type", label: "Type", render: (item) => <StatusBadge label={item.type.replace("_", " ")} variant={typeVariant[item.type] || "neutral"} /> },
    { key: "order", label: "Order", sortable: true },
    { key: "isActive", label: "Status", render: (item) => <ActiveBadge isActive={item.isActive} /> },
  ];

  return (
    <div>
      <AdminPageHeader title="Partners" actionLabel="Add Partner" actionHref="/admin/partners/new" />
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "PARTNER", "CLIENT", "DONOR", "CRISIS_PARTNER"].map((t) => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === t ? "bg-brand-blue text-white" : "bg-[#1e293b] text-gray-400 hover:text-white"}`}
          >
            {t ? t.replace("_", " ") : "All"}
          </button>
        ))}
      </div>
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onEdit={(item) => router.push(`/admin/partners/${item.id}/edit`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Partner" message={`Delete "${deleteTarget?.nameEn}"?`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
