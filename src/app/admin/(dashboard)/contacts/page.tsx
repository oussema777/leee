"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import { ReadBadge } from "../../components/StatusBadge";
import AdminModal from "../../components/AdminModal";
import { useToast } from "../../components/AdminToast";
import { adminGet, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Contact>>(`/contacts?page=${page}&search=${search}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load contacts"); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/contacts/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Contact>[] = [
    { key: "name", label: "Name", sortable: true, render: (item) => (
      <span className={item.isRead ? "text-gray-300" : "text-white font-semibold"}>
        {!item.isRead && <span className="inline-block w-2 h-2 bg-brand-blue rounded-full mr-2" />}
        {item.name}
      </span>
    )},
    { key: "email", label: "Email" },
    { key: "subject", label: "Subject" },
    { key: "isRead", label: "Status", render: (item) => <ReadBadge isRead={item.isRead} /> },
    { key: "createdAt", label: "Date", sortable: true, render: (item) => new Date(item.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <AdminPageHeader title="Contact Messages" />
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onView={(item) => router.push(`/admin/contacts/${item.id}`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Message" message={`Delete message from "${deleteTarget?.name}"?`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
