"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, MousePointerClick, Eye, UserMinus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminPageHeader from "../../../../components/AdminPageHeader";
import StatusBadge from "../../../../components/StatusBadge";
import { useToast } from "../../../../components/AdminToast";
import { adminGet } from "@/lib/admin-api";

type CampaignStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED";

interface CampaignSummaryResponse {
  campaign: {
    id: string;
    subject: string;
    status: CampaignStatus;
    locale: "EN" | "AR";
    targetTags: string[];
    recipientCount: number;
    sentAt: string | null;
    createdAt: string;
  };
  summary: {
    sent: number;
    delivered: number;
    uniqueOpens: number;
    uniqueClicks: number;
    unsubscribes: number;
    bounces: number;
    openRate: number;
    clickRate: number;
  };
  finalizing: boolean;
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

const pct = (rate: number) => `${(rate * 100).toFixed(1)}%`;

export default function CampaignSummaryPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const toast = useToast();
  const [data, setData] = useState<CampaignSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await adminGet<CampaignSummaryResponse>(`/newsletter/campaigns/${id}/summary`);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) toast.error("Failed to load campaign summary");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  const backLink = (
    <Link
      href="/admin/newsletter/campaigns"
      className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4"
    >
      <ArrowLeft size={16} />
      Back to Campaigns
    </Link>
  );

  if (loading) {
    return (
      <div>
        {backLink}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#1e293b] rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        {backLink}
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Failed to load campaign summary.</p>
        </div>
      </div>
    );
  }

  const { campaign, summary, finalizing } = data;

  const stats = [
    { label: "Sent", value: summary.sent.toLocaleString(), icon: Send, color: "bg-brand-blue" },
    { label: "Delivered", value: summary.delivered.toLocaleString(), icon: CheckCircle, color: "bg-emerald-500" },
    { label: "Open rate", value: pct(summary.openRate), icon: Eye, color: "bg-purple-500" },
    { label: "Click rate", value: pct(summary.clickRate), icon: MousePointerClick, color: "bg-yellow-500" },
    { label: "Unsubscribes", value: summary.unsubscribes.toLocaleString(), icon: UserMinus, color: "bg-orange-500" },
    { label: "Bounces", value: summary.bounces.toLocaleString(), icon: AlertTriangle, color: "bg-red-500" },
  ];

  return (
    <div>
      {backLink}
      <AdminPageHeader title={campaign.subject} />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <StatusBadge label={campaign.status} variant={statusVariant(campaign.status)} />
        <StatusBadge label={campaign.locale} variant="neutral" />
        {campaign.targetTags.length > 0 && (
          <span className="text-sm text-gray-400">{campaign.targetTags.join(", ")}</span>
        )}
        <span className="text-sm text-gray-500">
          {campaign.sentAt
            ? `Sent ${new Date(campaign.sentAt).toLocaleString()}`
            : `Created ${new Date(campaign.createdAt).toLocaleString()}`}
        </span>
      </div>

      {finalizing && (
        <div className="bg-brand-blue/10 border border-brand-blue/30 rounded-2xl p-4 mb-6 text-sm text-brand-blue">
          Stats are still finalizing — open/click events can take a few minutes to arrive.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((card) => (
          <div
            key={card.label}
            className="bg-[#1e293b] rounded-2xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.color)}>
                <card.icon size={20} className="text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4 max-w-2xl">
        Open rate is approximate — Apple Mail Privacy Protection inflates opens. Treat clicks as the
        reliable signal.
      </p>
    </div>
  );
}
