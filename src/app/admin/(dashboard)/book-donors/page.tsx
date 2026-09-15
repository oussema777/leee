"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import AdminModal from "../../components/AdminModal";
import AdminPageHeader from "../../components/AdminPageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/AdminToast";
import { adminDelete, adminGet, type PaginatedResponse } from "@/lib/admin-api";

interface Donor { id: string; type: "INDIVIDUAL" | "ORGANISATION"; displayName: string; contactName: string | null; phone: string; email: string | null; logoUrl: string | null; logoApproved: boolean; publicRecognition: boolean; active: boolean; _count: { donations: number; inventoryItems: number }; }

export default function BookDonorsPage() {
  const router = useRouter(); const toast = useToast();
  const [data, setData] = useState<Donor[]>([]); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(""); const [type, setType] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Donor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const load = useCallback(async () => { setLoading(true); try {
    const params = new URLSearchParams({ page: String(page), search }); if (type) params.set("type", type);
    const result = await adminGet<PaginatedResponse<Donor>>(`/book-donors?${params}`);
    setData(result.data); setTotal(result.pagination.total); setTotalPages(result.pagination.totalPages);
  } catch { toast.error("Failed to load donors"); } finally { setLoading(false); } }, [page, search, type, toast]);
  useEffect(() => { load(); }, [load]);
  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await adminDelete(`/book-donors/${deleteTarget.id}`);
      setDeleteTarget(null);
      toast.success("Donor deleted");
      if (data.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete donor. Please try again.");
    } finally {
      setDeleting(false);
    }
  };
  const columns: Column<Donor>[] = [
    { key: "logoUrl", label: "", render: (item) => item.logoUrl && item.logoApproved ? <img src={item.logoUrl} alt="" className="size-10 rounded-lg bg-white object-contain p-1" /> : <span className="flex size-10 items-center justify-center rounded-lg bg-gray-700 font-semibold text-gray-300">{item.displayName[0]?.toUpperCase()}</span> },
    { key: "displayName", label: "Donor", sortable: true, render: (item) => <div><p className="font-medium text-white">{item.displayName}</p>{item.contactName && <p className="text-xs text-gray-400">Contact: {item.contactName}</p>}</div> },
    { key: "type", label: "Type", render: (item) => <StatusBadge label={item.type === "ORGANISATION" ? "Organisation" : "Individual"} variant={item.type === "ORGANISATION" ? "info" : "neutral"} /> },
    { key: "phone", label: "Contact", render: (item) => <div><p>{item.phone}</p>{item.email && <p className="text-xs text-gray-400">{item.email}</p>}</div> },
    { key: "publicRecognition", label: "Recognition", render: (item) => item.publicRecognition ? "Public" : "Anonymous" },
    { key: "donations", label: "Records", render: (item) => `${item._count.donations} donations / ${item._count.inventoryItems} books` },
  ];
  return <div><AdminPageHeader title="Book Donors" actionLabel="Add Donor" actionHref="/admin/book-donors/new" />
    <div className="mb-4"><select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="rounded-xl border border-gray-700/50 bg-[#1e293b] px-3 py-2.5 text-sm text-white"><option value="">All donor types</option><option value="INDIVIDUAL">Individuals</option><option value="ORGANISATION">Organisations</option></select></div>
    <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} onPageChange={setPage} onEdit={(item) => router.push(`/admin/book-donors/${item.id}/edit`)} onDelete={(item) => { setDeleteError(""); setDeleteTarget(item); }} loading={loading} />
    <AdminModal
      isOpen={!!deleteTarget}
      onClose={() => { if (!deleting) setDeleteTarget(null); }}
      onConfirm={handleDelete}
      title="Delete donor?"
      message={`Are you sure you want to permanently delete "${deleteTarget?.displayName ?? ""}"?${deleteTarget && (deleteTarget._count.donations > 0 || deleteTarget._count.inventoryItems > 0) ? ` The ${deleteTarget._count.donations} donation record(s) and ${deleteTarget._count.inventoryItems} book(s) will be kept, but will no longer be linked to this donor.` : ""} This cannot be undone.`}
      confirmLabel="Delete donor"
      loading={deleting}
      loadingLabel="Deleting..."
      error={deleteError}
    />
  </div>;
}
