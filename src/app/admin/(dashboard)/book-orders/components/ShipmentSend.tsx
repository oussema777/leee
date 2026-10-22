"use client";
import { useEffect, useRef, useState } from "react";
import type { PreparationContext } from "@/lib/aramex/preparation";
import { adminGet } from "@/lib/admin-api";

const field = "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-gray-600 bg-[#0f172a] px-3 py-2 text-white";
const Required = () => <span aria-hidden="true" className="text-red-400"> *</span>;
export function ShipmentSend({ orderId, context, dirty, blocked, onBusy, onReload }: {
  orderId: string; context: PreparationContext; dirty: boolean; blocked: boolean;
  onBusy: (busy: boolean) => void; onReload: () => void;
}) {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [review, setReview] = useState(false);
  const [shipping, setShipping] = useState(""); const [due, setDue] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false); const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false); const panel = useRef<HTMLElement>(null);
  const saved = context.savedDraft;
  const path = `/book-orders/${encodeURIComponent(orderId)}/shipping/submit`;
  useEffect(() => {
    let active = true;
    setChecking(true); setAvailable(false);
    adminGet<{ available: boolean }>(path).then(value => { if (active) setAvailable(value.available); })
      .catch(() => { if (active) setError("Unable to check sending availability. Reload this page to try again."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [path]);
  useEffect(() => { setReview(false); setConfirmed(false); }, [saved?.version, dirty]);
  useEffect(() => { if (review) panel.current?.focus(); }, [review]);
  const approvedCity = !!saved && context.cities.some(city => city.toLowerCase() === saved.input.city.trim().toLowerCase());
  const ready = available && !!saved && !saved.stale && approvedCity && !dirty && !blocked && context.submission?.status === "DRAFT";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || !confirmed || inFlight.current || locked) return;
    const shippingMs = new Date(shipping).getTime(), dueMs = new Date(due).getTime(), now = Date.now();
    if (!Number.isFinite(shippingMs) || !Number.isFinite(dueMs) || shippingMs < now || shippingMs > now + 7 * 86400000 || dueMs < shippingMs || dueMs > shippingMs + 30 * 86400000) {
      setError("Choose a future shipping time within 7 days, then a due time on or after it and no more than 30 days later."); return;
    }
    inFlight.current = true; setSending(true); onBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin${path}`, { method: "POST", credentials: "include", signal: AbortSignal.timeout(60000),
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedDraftVersion: saved!.version, confirmedUat: true,
          shippingAt: new Date(shippingMs).toISOString(), dueAt: new Date(dueMs).toISOString() }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "The request could not be completed.");
      if (!["CREATED", "UNKNOWN", "REJECTED", "SUBMITTING"].includes(result.status)) throw Error("Unrecognized response.");
      // Reload authoritative persisted status, including recovery and label controls.
      setLocked(true); onReload();
    } catch (err) {
      setLocked(true);
      setError(`${err instanceof Error ? err.message : "No confirmed response was received."} Reload the saved shipment before doing anything else. Aramex may have received this request; do not send it again.`);
    } finally { setSending(false); onBusy(false); inFlight.current = false; }
  }
  return <section ref={panel} tabIndex={-1} aria-label="Send a UAT shipment" className="my-5 rounded-xl border border-brand-blue/40 bg-[#1e293b] p-5 outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
    <h2 className="font-semibold text-white">Send a test shipment to Aramex</h2>
    <p className="mt-2 text-sm text-amber-200">UAT only. This creates a test booking, not a customer dispatch.</p>
    {checking ? <p role="status" className="mt-3 text-sm text-gray-400">Checking availability…</p>
      : !available ? <p className="mt-3 text-sm text-gray-400">Sending is unavailable until UAT account settings and access are configured.</p>
      : !ready && <p className="mt-3 text-sm text-amber-200">{dirty ? "Save your latest changes before sending." : !saved ? "Review and save a shipping draft first." : saved.stale ? "The order changed. Reload, review and save the draft again." : !approvedCity ? "Choose an approved Aramex city and save the draft before sending. Custom areas can still be kept in drafts." : "Review and save an eligible draft before sending."}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    {locked ? <button type="button" onClick={onReload} className="mt-4 min-h-11 rounded-lg border border-gray-600 px-4 text-brand-blue">Reload saved shipment</button>
      : !review ? <button type="button" disabled={!ready} onClick={() => { setReview(true); setError(""); }} className="mt-4 min-h-11 rounded-lg border border-brand-blue/40 px-4 text-brand-blue disabled:cursor-not-allowed disabled:opacity-50">Review test shipment</button>
      : saved && <form onSubmit={send} className="mt-4">
        <fieldset disabled={sending || !ready}>
          <legend className="font-semibold text-white">Check saved draft · version {saved.version}</legend>
          <dl className="mt-3 space-y-3 text-sm text-gray-300">
            <div><dt className="text-gray-400">Recipient</dt><dd>{saved.input.recipientName} · {saved.input.recipientPhone}</dd></div>
            <div><dt className="text-gray-400">Address</dt><dd className="break-words">{[saved.input.addressLine1, saved.input.addressLine2, saved.input.addressLine3, saved.input.city].filter(Boolean).join(", ")}</dd></div>
            <div><dt className="text-gray-400">Packed parcels</dt><dd>{saved.input.parcels.length} parcels · {saved.input.parcels.reduce((sum, parcel) => sum + parcel.weightKg, 0).toFixed(3)} kg</dd></div>
            <div><dt className="text-gray-400">Courier collects from recipient</dt><dd className="font-semibold text-white">${((context.collection.amountCents ?? 0) / 100).toFixed(2)} USD</dd></div>
          </dl>
          <p className="mt-4 text-sm text-gray-400">Enter the agreed test dates in your browser timezone: {timezone}. These dates do not arrange a pickup or promise delivery.</p>
          <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
            <label className="min-w-0 text-sm text-gray-300">Shipping date and time<Required /><input type="datetime-local" required value={shipping} onChange={e => setShipping(e.target.value)} className={field} /></label>
            <label className="min-w-0 text-sm text-gray-300">Due date and time<Required /><input type="datetime-local" required value={due} onChange={e => setDue(e.target.value)} className={field} /></label>
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm text-gray-300"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 size-4 shrink-0" /><span>I checked this saved draft and understand this creates an Aramex UAT test booking.<Required /></span></label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" disabled={!confirmed || !shipping || !due} className="min-h-11 rounded-lg bg-brand-blue px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{sending ? "Sending test shipment…" : "Create Aramex test shipment"}</button>
            <button type="button" onClick={() => { setReview(false); setConfirmed(false); }} className="min-h-11 px-3 text-sm text-gray-300">Back to draft</button>
          </div>
        </fieldset>
        {sending && <p role="status" className="mt-3 text-sm text-amber-200">Waiting for Aramex. Keep this page open. Do not submit from another tab.</p>}
      </form>}
  </section>;
}
