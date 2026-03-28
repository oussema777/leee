"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import { ActiveBadge } from "../../components/StatusBadge";
import AdminModal from "../../components/AdminModal";
import { useToast } from "../../components/AdminToast";
import { adminGet, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface Testimonial {
  id: string;
  nameEn: string;
  titleEn: string | null;
  quoteEn: string;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
}

export default function TestimonialsPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Testimonial>>(`/testimonials?page=${page}&search=${search}`);
      setData(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch { toast.error("Failed to load testimonials"); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDelete(`/testimonials/${deleteTarget.id}`);
      toast.success("Testimonial deleted");
      setDeleteTarget(null);
      fetchData();
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Testimonial>[] = [
    { key: "nameEn", label: "Name", sortable: true },
    { key: "titleEn", label: "Title" },
    { key: "quoteEn", label: "Quote", render: (item) => <span className="line-clamp-2 max-w-xs">{item.quoteEn}</span> },
    { key: "order", label: "Order", sortable: true },
    { key: "isActive", label: "Status", render: (item) => <ActiveBadge isActive={item.isActive} /> },
  ];

  return (
    <div>
      <AdminPageHeader title="Testimonials" actionLabel="Add Testimonial" actionHref="/admin/testimonials/new" />
      <AdminDataTable
        columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onEdit={(item) => router.push(`/admin/testimonials/${item.id}/edit`)}
        onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Testimonial" message={`Delete "${deleteTarget?.nameEn}"?`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
