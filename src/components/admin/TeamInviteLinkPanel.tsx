"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { adminPost } from "@/lib/admin-api";

interface InviteLinkData {
  token: string;
  url: string;
}

export default function TeamInviteLinkPanel() {
  const [data, setData] = useState<InviteLinkData | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/team-invite-link", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 403) { setHidden(true); return; }
        if (!res.ok) return;
        const json: InviteLinkData = await res.json();
        setData(json);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (hidden) return null;

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
      <Loader2 size={14} className="animate-spin" /> Loading invite link…
    </div>
  );

  if (!data) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm("This breaks the old link. Continue?")) return;
    setRegenerating(true);
    try {
      const result = await adminPost<InviteLinkData>("/team-invite-link/regenerate", {});
      setData(result);
    } catch {
      // silently ignore — user remains on current link
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="bg-[#1e293b] rounded-xl p-4 mb-6 border border-[#334155]">
      <h3 className="text-sm font-semibold text-white mb-3">Team Invite Link</h3>
      <div className="flex gap-2 items-center">
        <input
          readOnly
          value={data.url}
          className="flex-1 bg-[#0f172a] text-gray-300 text-sm px-3 py-2 rounded-lg border border-[#334155] focus:outline-none truncate"
        />
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 rounded-lg transition-colors whitespace-nowrap"
        >
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
        </button>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-300 bg-[#0f172a] hover:text-white border border-[#334155] rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Regenerate
        </button>
      </div>
    </div>
  );
}
