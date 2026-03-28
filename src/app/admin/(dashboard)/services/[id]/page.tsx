"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { ReadBadge } from "../../../components/StatusBadge";
import AdminModal from "../../../components/AdminModal";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPatch, adminDelete } from "@/lib/admin-api";

interface ServiceReq {
  id: string;
  name: string; email: string; phone: string | null;
  organization: string | null; serviceType: string | null;
  description: string; budget: string | null; timeline: string | null;
  isRead: boolean; createdAt: string;
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<ServiceReq | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    adminGet<ServiceReq>(`/services/${id}`)
      .then((d) => { setData(d); if (!d.isRead) adminPatch(`/services/${id}/read`).catch(() => {}); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-400 p-8">Loading...</div>;
  if (!data) return <div className="text-gray-400 p-8">Not found.</div>;

  const fields = [
    { label: "Name", value: data.name },
    { label: "Email", value: data.email },
    { label: "Phone", value: data.phone },
    { label: "Organization", value: data.organization },
    { label: "Service Type", value: data.serviceType },
    { label: "Budget", value: data.budget },
    { label: "Timeline", value: data.timeline },
  ].filter((f) => f.value);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/services" className="p-2 text-gray-400 hover:text-white transition-colors"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-white">Service Request</h1>
        </div>
        <button onClick={() => setShowDelete(true)} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={20} /></button>
      </div>

      <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <ReadBadge isRead={data.isRead} />
          <span className="text-sm text-gray-400">{new Date(data.createdAt).toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label}><label className="text-xs text-gray-500 uppercase">{f.label}</label><p className="text-white">{f.value}</p></div>
          ))}
        </div>
        <div><label className="text-xs text-gray-500 uppercase">Description</label><p className="text-gray-300 whitespace-pre-wrap mt-1">{data.description}</p></div>
      </div>

      <AdminModal isOpen={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={async () => { await adminDelete(`/services/${id}`); toast.success("Deleted"); router.push("/admin/services"); }}
        title="Delete Request" message="This action cannot be undone." confirmLabel="Delete"
      />
    </div>
  );
}
