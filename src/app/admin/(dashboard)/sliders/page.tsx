"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import { ActiveBadge } from "../../components/StatusBadge";
import AdminModal from "../../components/AdminModal";
import { useToast } from "../../components/AdminToast";
import { adminGet, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface Slider {
  id: string;
  titleEn: string;
  titleAr: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function SlidersPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Slider | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Slider>>(
        `/sliders?page=${page}&search=${search}`
      );
      setData(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      toast.error("Failed to load sliders");
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDelete(`/sliders/${deleteTarget.id}`);
      toast.success("Slider deleted");
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error("Failed to delete slider");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Slider>[] = [
    {
      key: "imageUrl",
      label: "Image",
      render: (item) => (
        <img src={item.imageUrl} alt="" className="h-10 w-16 object-cover rounded-lg" />
      ),
    },
    { key: "titleEn", label: "Title (EN)", sortable: true },
    { key: "order", label: "Order", sortable: true },
    {
      key: "isActive",
      label: "Status",
      render: (item) => <ActiveBadge isActive={item.isActive} />,
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Sliders" actionLabel="Add Slider" actionHref="/admin/sliders/new" />
      <AdminDataTable
        columns={columns}
        data={data}
        totalPages={totalPages}
        currentPage={page}
        total={total}
        search={search}
        onSearch={(s) => { setSearch(s); setPage(1); }}
        onPageChange={setPage}
        onEdit={(item) => router.push(`/admin/sliders/${item.id}/edit`)}
        onDelete={setDeleteTarget}
        loading={loading}
      />
      <AdminModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Slider"
        message={`Are you sure you want to delete "${deleteTarget?.titleEn}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
