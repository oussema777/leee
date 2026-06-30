"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import AdminPageHeader from "../../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../../components/AdminDataTable";
import AdminModal from "../../../components/AdminModal";
import StatusBadge from "../../../components/StatusBadge";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPost, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface Contact {
  id: string;
  email: string;
  name: string | null;
  tags: string[];
  status: string;
  createdAt: string;
}

interface ImportReport {
  added: number;
  duplicates: number;
  invalid: number;
  suppressedKeptOff: number;
}

function statusVariant(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status.toLowerCase()) {
    case "subscribed":
    case "active":
      return "success";
    case "unsubscribed":
    case "suppressed":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "neutral";
  }
}

export default function NewsletterContactsPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (tag) params.set("tag", tag);
      const res = await adminGet<PaginatedResponse<Contact>>(`/newsletter/contacts?${params.toString()}`);
      setData(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [page, search, tag, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const csv = await file.text();
      const report = await adminPost<ImportReport>("/newsletter/contacts", { csv });
      toast.success(
        `${report.added} added, ${report.duplicates} duplicates, ${report.invalid} invalid, ${report.suppressedKeptOff} suppressed (kept off)`
      );
      setPage(1);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import contacts");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDelete(`/newsletter/contacts/${deleteTarget.id}`);
      toast.success("Deleted");
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Contact>[] = [
    { key: "email", label: "Email" },
    { key: "name", label: "Name", render: (item) => item.name || "—" },
    {
      key: "tags",
      label: "Tags",
      render: (item) => (item.tags && item.tags.length > 0 ? item.tags.join(", ") : "—"),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge label={item.status} variant={statusVariant(item.status)} />,
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Newsletter Contacts" />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Upload size={18} />
          {uploading ? "Importing..." : "Import CSV"}
        </button>

        <input
          type="text"
          placeholder="Filter by tag..."
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-[#1e293b] border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
        />
      </div>

      <AdminDataTable
        columns={columns}
        data={data}
        totalPages={totalPages}
        currentPage={page}
        total={total}
        search={search}
        onSearch={(s) => {
          setSearch(s);
          setPage(1);
        }}
        onPageChange={setPage}
        onDelete={setDeleteTarget}
        loading={loading}
      />

      <AdminModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Delete "${deleteTarget?.email}"?`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
