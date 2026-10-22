"use client";
import { useEffect, useState } from "react";
import { adminGet, adminPost } from "@/lib/admin-api";
import { safeLabelUrl } from "@/lib/aramex/submission-status";

export function ShipmentLabel({ orderId, onRetrieved }: { orderId: string; onRetrieved: (url: string) => void }) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const path = `/book-orders/${orderId}/shipping/label`;
  useEffect(() => {
    let active = true;
    setAvailable(false); setUrl(null); setError("");
    adminGet<{ available: boolean }>(path).then(value => { if (active) setAvailable(value.available); })
      .catch(() => { if (active) setError("Unable to check label availability. Reload to try again."); });
    return () => { active = false; };
  }, [path]);
  async function retrieve() {
    setBusy(true); setError("");
    try {
      const result = await adminPost<{ labelUrl: string }>(path, {});
      const safe = safeLabelUrl(result.labelUrl);
      if (!safe) throw Error("No valid label was returned.");
      setUrl(safe);
      onRetrieved(safe);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to retrieve the label."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Retrieve shipment label" className="mb-5 rounded-xl border border-gray-700 bg-[#1e293b] p-5">
    <h2 className="font-semibold text-white">Retrieve a test shipping label</h2>
    <p className="mt-2 text-sm text-gray-400">Gets a printable label for this existing tracking number. It does not book another shipment.</p>
    <button type="button" onClick={retrieve} disabled={!available || busy}
      className="mt-3 rounded-lg border border-brand-blue/40 px-4 py-2 text-sm text-brand-blue disabled:cursor-not-allowed disabled:opacity-50">
      {busy ? "Retrieving label…" : "Retrieve label from Aramex"}
    </button>
    {!available && <p className="mt-2 text-sm text-gray-400">Available once UAT access and the account’s label settings are configured.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    {url && <p role="status" className="mt-3 text-sm text-gray-300">Label saved. <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="text-brand-blue underline">Open label to print</a></p>}
  </section>;
}
