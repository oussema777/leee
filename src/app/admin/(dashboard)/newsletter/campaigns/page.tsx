"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "../../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../../components/AdminDataTable";
import StatusBadge from "../../../components/StatusBadge";
import { useToast } from "../../../components/AdminToast";
import { adminGet, type PaginatedResponse } from "@/lib/admin-api";

type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED";

interface Campaign {
  id: string;
  subject: string;
  status: CampaignStatus;
  locale: "EN" | "AR";
  targetTags: string[];
  recipientCount: number;
  sentAt: string | null;
  createdAt: string;
}

function statusVariant(status: CampaignStatus): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "SENT":
      return "success";
    case "SENDING":
      return "info";
    case "FAILED":
      return "danger";
    case "DRAFT":
      return "warning";
    default:
      return "neutral";
  }
}

export default function NewsletterCampaignsPage() {
  const toast = useToast();
  const [data, setData] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Campaign>>(`/newsletter/campaigns?page=${page}`);
      setData(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<Campaign>[] = [
    {
      key: "subject",
      label: "Subject",
      render: (item) => (
        <Link
          href={`/admin/newsletter/campaigns/${item.id}`}
          className="font-medium text-white hover:text-brand-blue transition-colors"
        >
          {item.subject}
        </Link>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <div className="flex items-center gap-2">
          <StatusBadge label={item.status} variant={statusVariant(item.status)} />
          {item.status === "SENDING" && <span className="text-xs text-gray-400">sending…</span>}
        </div>
      ),
    },
    {
      key: "targetTags",
      label: "Group",
      render: (item) =>
        item.targetTags && item.targetTags.length > 0 ? item.targetTags.join(", ") : "—",
    },
    {
      key: "recipientCount",
      label: "Recipients",
      render: (item) => item.recipientCount.toLocaleString(),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (item) =>
        new Date(item.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Campaigns" />
      <AdminDataTable
        columns={columns}
        data={data}
        totalPages={totalPages}
        currentPage={page}
        total={total}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
