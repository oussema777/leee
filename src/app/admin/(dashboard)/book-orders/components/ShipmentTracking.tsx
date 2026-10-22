"use client";
import { useState } from "react";
import { adminGet, adminPost } from "@/lib/admin-api";
type History = {
  environment: string; status: string; needsReview: boolean; truncated: boolean;
  lookupAvailable?: boolean;
  events: { id: string; code: string; problemCode: string; description: string | null; occurredAt: string; receivedAt: string; location: string; comments: string }[];
};
const labels: Record<string, string> = {
  UPDATES_RECEIVED: "Carrier updates received", EXCEPTION: "Delivery needs attention",
  AWAITING_UPDATES: "Awaiting tracking updates", PICKED_UP: "Picked up", OUT_FOR_DELIVERY: "Out for delivery",
  PARTIAL_OUT_FOR_DELIVERY: "Part of the shipment is out for delivery", PARTIAL_DELIVERY: "Partially delivered",
  DELIVERED: "Delivered", RETURNED: "Returned to shipper", REVIEW_REQUIRED: "Tracking needs review",
};
export function ShipmentTracking({ orderId }: { orderId: string }) {
  const [history, setHistory] = useState<History | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    setBusy(true); setError("");
    try { setHistory(await adminGet<History>(`/book-orders/${orderId}/shipping/tracking`)); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load tracking."); }
    finally { setBusy(false); }
  }
  async function sync() {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await adminPost<{ received: number; added: number }>(`/book-orders/${orderId}/shipping/tracking/sync`, {});
      setMessage(result.received ? `Aramex history checked. ${result.added} new updates saved; repeated updates were ignored.`
        : "Aramex returned no tracking events. Saved history was kept; this does not mean no shipment exists.");
      setHistory(await adminGet<History>(`/book-orders/${orderId}/shipping/tracking`));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to check Aramex history."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Delivery tracking" className="mb-5 rounded-xl border border-gray-700 bg-[#1e293b] p-5">
    <h2 className="font-semibold text-white">Delivery tracking</h2>
    <p className="mt-2 text-sm text-gray-400">Carrier updates are separate from order and payment status. Delivery does not confirm COD settlement.</p>
    <button type="button" onClick={load} disabled={busy} className="mt-4 min-h-11 rounded-lg border border-sky-400/50 px-4 py-2 text-sm font-semibold text-sky-300 disabled:opacity-50">{busy ? "Loading updates…" : history ? "Refresh received updates" : "View received updates"}</button>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    {message && <p role="status" className="mt-3 text-sm text-gray-200">{message}</p>}
    {history && <div className="mt-5">
      <button type="button" onClick={sync} disabled={busy || !history.lookupAvailable} className="mb-3 min-h-11 rounded-lg border border-sky-400/50 px-4 py-2 text-sm font-semibold text-sky-300 disabled:cursor-not-allowed disabled:opacity-50">Check Aramex for missed updates</button>
      {!history.lookupAvailable && <p className="mb-4 text-xs text-gray-400">Direct UAT lookup awaits verified account access and fixed-IP configuration.</p>}
      <p className="font-semibold text-white">{labels[history.status] ?? "Tracking needs review"} <span className="ml-2 text-xs font-normal text-gray-400">{history.environment}</span></p>
      {history.needsReview && <p className="mt-2 text-sm text-amber-200">Some updates are unknown or conflicting. Verify the carrier history before taking action.</p>}
      {!history.events.length && <p className="mt-3 text-sm text-gray-300">No updates have been received yet. This does not mean the shipment has not moved.</p>}
      <ol className="mt-4 space-y-3">
        {history.events.map(event => <li key={event.id} className="rounded-lg border border-gray-700 bg-[#0f172a] p-4 text-sm">
          <p className="font-semibold text-white">{event.description ?? "Unrecognized carrier update"}</p>
          <p className="mt-1 text-gray-400"><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time> · {event.code}{event.problemCode ? ` / ${event.problemCode}` : ""}</p>
          {event.location && <p className="mt-2 break-words text-gray-300">{event.location}</p>}
          {event.comments && <p className="mt-2 whitespace-pre-wrap break-words text-gray-300">{event.comments}</p>}
        </li>)}
      </ol>
      <p className="mt-3 text-xs text-gray-400">Newest carrier event first. Shows up to 100 received updates; refresh reads saved history, not a live Aramex lookup.</p>
      {history.truncated && <p className="mt-2 text-sm text-amber-200">History exceeds the review limit. Contact support to inspect the complete record.</p>}
    </div>}
  </section>;
}
