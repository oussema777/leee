import Link from "next/link";
import { useEffect, useState } from "react";
import { LockKeyhole, Truck } from "lucide-react";
import { shipmentStatusProblem } from "@/lib/aramex/eligibility";
import { shipmentStatusText } from "@/lib/aramex/submission-status";

export function AramexPreparationLink({ orderId, status, updatedAt }: { orderId: string; status: string; updatedAt: string }) {
  const problem = shipmentStatusProblem(status);
  const [summary, setSummary] = useState<{ stale: boolean; editable: boolean; status: string } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setSummary(null); setFailed(false);
    fetch(`/api/admin/book-orders/${encodeURIComponent(orderId)}/shipping?summary=1`, {
      credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw Error("Unable to load shipping status");
      const data = await response.json();
      if (!controller.signal.aborted) setSummary(data.savedDraft ? { ...data.savedDraft, status: data.submission?.status ?? "DRAFT" } : null);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [orderId, updatedAt]);
  return <div className="mb-5 rounded-xl border border-gray-700 bg-[#0f172a]/50 p-4">
    <p className="mb-3 text-sm font-semibold text-white">Aramex delivery</p>
    {summary && <p className={`mb-3 text-sm ${summary.stale || ["UNKNOWN", "SUBMITTING", "REJECTED"].includes(summary.status) ? "text-amber-200" : summary.status === "CREATED" ? "text-emerald-300" : "text-gray-300"}`}>
      {!summary.editable ? shipmentStatusText(summary.status) : summary.stale ? "Saved draft needs review: the order or payment changed." : shipmentStatusText(summary.status)}{summary.editable ? " · Not booked with Aramex" : ""}
    </p>}
    {failed && <p className="mb-3 text-sm text-amber-200">Saved draft status could not be loaded. Open preparation to check again.</p>}
    {problem && (!summary || summary.editable) ? <>
      <button type="button" disabled aria-describedby="aramex-status-requirement"
        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-500 disabled:cursor-not-allowed">
        <LockKeyhole size={16} />Prepare Aramex delivery
      </button>
      <p id="aramex-status-requirement" className="mt-3 text-sm leading-6 text-gray-400">{problem}</p>
      {status === "NEW" && <a href="#manage-order" className="mt-2 inline-block text-sm font-semibold text-brand-blue hover:underline">Go to order status</a>}
    </> : <>
      <Link href={`/admin/book-orders/${orderId}/shipping`}
        className="inline-flex items-center gap-2 rounded-lg border border-brand-blue/40 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-blue/10">
        <Truck size={16} />{summary ? summary.editable ? "Continue Aramex draft" : "View Aramex shipment" : "Prepare Aramex delivery"}
      </Link>
      <p className="mt-3 text-sm text-gray-400">{summary && !summary.editable ? "Check the shipment result, tracking number and label." : "Review recipient details, packed parcels and cash to collect."}</p>
    </>}
  </div>;
}
