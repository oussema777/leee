"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import { ActiveBadge } from "../../components/StatusBadge";
import AdminModal from "../../components/AdminModal";
import { useToast } from "../../components/AdminToast";
import { adminGet, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface GalleryImage {
  id: string;
  imageUrl: string;
  captionEn: string | null;
  albumName: string | null;
  order: number;
  isActive: boolean;
}

export default function GalleryPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<GalleryImage>>(`/gallery?page=${page}&search=${search}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load gallery"); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/gallery/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<GalleryImage>[] = [
    { key: "imageUrl", label: "Image", render: (item) => <img src={item.imageUrl} alt="" className="h-10 w-16 object-cover rounded-lg" /> },
    { key: "captionEn", label: "Caption" },
    { key: "albumName", label: "Album" },
    { key: "order", label: "Order", sortable: true },
    { key: "isActive", label: "Status", render: (item) => <ActiveBadge isActive={item.isActive} /> },
  ];

  return (
    <div>
      <AdminPageHeader title="Gallery" actionLabel="Add Image" actionHref="/admin/gallery/new" />
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onEdit={(item) => router.push(`/admin/gallery/${item.id}/edit`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Image" message="Delete this gallery image?" confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
