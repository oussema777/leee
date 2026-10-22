"use client";
import { useState, type FormEvent } from "react";
import { adminGet, adminPost } from "@/lib/admin-api";

type Review = {
  status: string; environment: string; updatedAt: string;
  attempt: null | { id: string; submissionKey: string; availableAt: string; startedAt: string;
    reconciliation: null | { outcome: string; actor: string; createdAt: string; evidenceSource: string; evidenceReference: string; notes: string } };
};
const field = "mt-2 block w-full rounded-lg border border-gray-600 bg-[#0f172a] p-3 text-base text-white";
const star = <span className="text-red-400"> *</span>;
export function ShipmentRecovery({ orderId, status }: { orderId: string; status: string }) {
  const [review, setReview] = useState<Review | null>(null);
  const [outcome, setOutcome] = useState("CREATED");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const uncertain = ["UNKNOWN", "SUBMITTING"].includes(status);
  async function load() {
    setBusy(true); setError("");
    try { setReview(await adminGet<Review>(`/book-orders/${orderId}/shipping/reconciliation`)); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load recovery details."); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !review?.attempt) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await adminPost(`/book-orders/${orderId}/shipping/reconciliation`, {
        expectedAttemptId: review.attempt.id, expectedUpdatedAt: review.updatedAt, outcome,
        evidenceSource: data.get("evidenceSource"), evidenceReference: data.get("evidenceReference"), notes: data.get("notes"),
        trackingNumber: outcome === "CREATED" ? data.get("trackingNumber") : "",
        labelUrl: outcome === "CREATED" ? data.get("labelUrl") : "", confirmed: data.get("confirmed") === "on",
      });
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to record recovery."); setBusy(false); }
  }
  if (status === "DRAFT") return null;
  const attempt = review?.attempt;
  const canReview = !!attempt && !attempt.reconciliation && ["UNKNOWN", "SUBMITTING"].includes(review!.status)
    && review!.environment === "UAT" && Date.parse(attempt.availableAt) <= Date.now();
  return <section aria-label="Shipment recovery" className="mb-5 rounded-xl border border-gray-700 bg-[#1e293b] p-5">
    <button type="button" disabled={busy} onClick={load} className="min-h-11 rounded-lg border border-sky-400/50 px-4 py-2 text-sm font-semibold text-sky-300 disabled:opacity-50">
      {busy ? "Please wait…" : review ? "Reload attempt details" : uncertain ? "Review uncertain booking" : "View shipment attempt"}
    </button>
    {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
    {review && <div className="mt-4 space-y-3 text-sm text-gray-300">
      <p>Environment: <strong>{review.environment}</strong> · Current status: {review.status}</p>
      {attempt ? <>
        <p>Request reference: <code className="break-all text-white">{attempt.submissionKey}</code></p>
        <p>Started: {new Date(attempt.startedAt).toLocaleString()}</p>
        {attempt.reconciliation ? <div className="rounded-lg bg-[#0f172a] p-4">
          <p className="font-semibold text-white">Recorded recovery: {attempt.reconciliation.outcome === "CREATED" ? "Shipment exists" : "No shipment created"}</p>
          <p className="mt-2">By {attempt.reconciliation.actor} · {new Date(attempt.reconciliation.createdAt).toLocaleString()}</p>
          <p className="mt-2 break-words">Evidence: {attempt.reconciliation.evidenceReference}</p>
          <p className="mt-2 whitespace-pre-wrap break-words">{attempt.reconciliation.notes}</p>
        </div> : uncertain && !canReview ? <p className="text-amber-200">Recovery is unavailable while the attempt is recent or its status has changed. Earliest review: {new Date(attempt.availableAt).toLocaleString()}. Reload the details after that time.</p> : null}
      </> : <p>No request attempt is recorded. Contact the developer before taking further action.</p>}
    </div>}
    {canReview && <form onSubmit={save} className="mt-5 space-y-5">
      <p className="text-sm leading-6 text-amber-200">Check this exact request reference with Aramex. A timeout or an empty tracking search does not prove that no shipment was created. This records your verified findings; it does not query Aramex or send a shipment.</p>
      <fieldset disabled={busy} className="space-y-5">
        <label className="block text-sm text-gray-300">Confirmed outcome{star}
          <select value={outcome} onChange={e => setOutcome(e.target.value)} className={field} required>
            <option value="CREATED">Shipment exists</option>
            <option value="NOT_CREATED">No shipment created</option>
          </select>
        </label>
        {outcome === "CREATED" && <>
          <label className="block text-sm text-gray-300">Confirmed tracking number{star}<input name="trackingNumber" required pattern="[A-Za-z0-9-]{5,50}" maxLength={50} className={field} /></label>
          <label className="block text-sm text-gray-300">Aramex label URL (optional)<input name="labelUrl" type="url" maxLength={4096} className={field} /><span className="mt-2 block text-xs">Leave blank if unavailable. Keep the confirmed shipment; retrieve its label separately.</span></label>
        </>}
        <label className="block text-sm text-gray-300">Evidence source{star}<select name="evidenceSource" required className={field} defaultValue=""><option value="" disabled>Choose a source</option><option value="ARAMEX_SUPPORT">Aramex support</option><option value="CARRIER_PORTAL">Aramex portal</option></select></label>
        <label className="block text-sm text-gray-300">Evidence reference{star}<input name="evidenceReference" minLength={10} maxLength={1000} required className={field} placeholder="Support ticket or portal record reference" /></label>
        <label className="block text-sm text-gray-300">What did Aramex confirm?{star}<textarea name="notes" rows={3} minLength={10} maxLength={1000} required className={field} /><span className="mt-2 block text-xs">Record who confirmed the outcome and when. Do not paste passwords or full customer records.</span></label>
        <label className="flex items-start gap-3 text-sm leading-6 text-gray-200"><input name="confirmed" type="checkbox" required className="mt-1 h-5 w-5 shrink-0" />
          <span>{outcome === "CREATED" ? "I verified that this tracking number belongs to this order and request." : "I obtained definitive confirmation that this request created no shipment. I understand that another attempt still requires reviewing and saving the draft."}{star}</span>
        </label>
        <button type="submit" className="min-h-11 rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Recording…" : "Record verified outcome"}</button>
      </fieldset>
    </form>}
  </section>;
}
