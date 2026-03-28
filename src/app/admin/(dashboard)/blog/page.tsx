"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import { PublishBadge } from "../../components/StatusBadge";
import AdminModal from "../../components/AdminModal";
import { useToast } from "../../components/AdminToast";
import { adminGet, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface BlogPost {
  id: string;
  titleEn: string;
  slug: string;
  authorName: string | null;
  category: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function BlogPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<BlogPost>>(`/blog?page=${page}&search=${search}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load blog posts"); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/blog/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<BlogPost>[] = [
    { key: "titleEn", label: "Title", sortable: true },
    { key: "authorName", label: "Author" },
    { key: "category", label: "Category" },
    { key: "isPublished", label: "Status", render: (item) => <PublishBadge isPublished={item.isPublished} /> },
    { key: "createdAt", label: "Created", sortable: true, render: (item) => new Date(item.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <AdminPageHeader title="Blog Posts" actionLabel="Add Post" actionHref="/admin/blog/new" />
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onEdit={(item) => router.push(`/admin/blog/${item.id}/edit`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Post" message={`Delete "${deleteTarget?.titleEn}"?`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
