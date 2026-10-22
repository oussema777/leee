"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adminGet } from "@/lib/admin-api";

type Event = { id: string; trackingNumber: string; code: string; problemCode: string; description: string | null;
  occurredAt: string; receivedAt: string; location: string; comments: string; orderNumber: string;
  reason: string; order: { id: string; reference: string } | null };
type Inbox = { total: number; page: number; totalPages: number; events: Event[] };
const reasons: Record<string, { title: string; action: string }> = {
  NO_BOOKING: { title: "No matching test shipment", action: "Check this tracking number against the Aramex test shipment records. If a booking was missed, verify its result in the order’s shipment recovery screen. Do not create another shipment based on this update." },
  BOOKING_UNCONFIRMED: { title: "Booking needs verification", action: "Open the order and verify the booking result with Aramex before recording recovery. A tracking update alone is not enough to confirm the booking." },
  READY_TO_LINK: { title: "Matching shipment is now available", action: "Open the order’s shipping page and choose View received updates. This links updates with the same test tracking number. Then refresh this inbox." },
};
export default function TrackingInboxPage() {
  const [data, setData] = useState<Inbox | null>(null);
  const [input, setInput] = useState(""); const [search, setSearch] = useState("");
  const [page, setPage] = useState(1); const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const request = useRef(0);
  useEffect(() => {
    const id = ++request.current;
    setLoading(true); setError(""); setData(null);
    adminGet<Inbox>(`/aramex/tracking-inbox?${new URLSearchParams({ page: String(page), trackingNumber: search })}`)
      .then(result => { if (id === request.current) {
        if (page > result.totalPages) { setPage(result.totalPages); return; }
        setData(result);
      } }).catch(err => { if (id === request.current) setError(err instanceof Error ? err.message : "Unable to load updates."); })
      .finally(() => { if (id === request.current) setLoading(false); });
    return () => { request.current++; };
  }, [search, page, reload]);
  const button = "rounded-lg border border-gray-600 px-4 py-2 text-sm text-brand-blue disabled:opacity-50 disabled:cursor-not-allowed";
  return <div className="max-w-4xl">
    <Link href="/admin/book-orders" className="text-sm text-brand-blue">← Book orders</Link>
    <h1 className="mt-5 text-2xl font-semibold text-white">Unmatched tracking updates</h1>
    <p className="mt-2 text-sm text-gray-300">Aramex test environment · Updates received but not yet linked to a confirmed shipment.</p>
    <p className="mt-2 text-sm text-gray-400">Updates stay here until matched. They do not change order status or confirm payment. This screen shows saved updates; refreshing does not contact Aramex.</p>
    <form className="my-5 flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); setSearch(input.trim()); setPage(1); setReload(value => value + 1); }}>
      <label className="min-w-0 basis-full text-sm text-gray-300 sm:flex-1 sm:basis-auto">Full tracking number
        <input value={input} onChange={event => setInput(event.target.value)} maxLength={50} placeholder="All unmatched updates"
          className="mt-2 w-full rounded-lg border border-gray-600 bg-[#0f172a] px-3 py-2 text-white" />
      </label>
      <button className={button} type="submit" disabled={loading}>Search</button>
      <button className={button} type="button" disabled={loading} onClick={() => setReload(value => value + 1)}>Refresh</button>
      {search && <button className={button} type="button" onClick={() => { setInput(""); setSearch(""); setPage(1); }}>Clear search</button>}
    </form>
    {loading && <p role="status" className="text-gray-300">Loading saved updates…</p>}
    {error && <p role="alert" className="rounded-lg border border-red-400/30 p-4 text-red-300">{error}</p>}
    {data && <>
      <p role="status" className="mb-4 text-sm text-gray-400">{data.total} unmatched {data.total === 1 ? "update" : "updates"}{search ? " for this tracking number" : ""}</p>
      {!data.events.length && <p className="rounded-xl bg-[#1e293b] p-5 text-gray-300">{search ? "No unmatched updates for this tracking number. It may already be linked, or no update has arrived." : "No unmatched updates right now. This does not confirm that tracking is connected or all shipments are up to date."}</p>}
      <div className="space-y-4">{data.events.map(event => <article key={event.id} className="min-w-0 break-words rounded-xl border border-gray-700 bg-[#1e293b] p-5">
        <h2 className="font-semibold text-white">Tracking {event.trackingNumber}</h2>
        <p className="mt-2 text-sm text-amber-200">{reasons[event.reason]?.title}</p>
        <p className="mt-2 text-sm text-gray-300">{reasons[event.reason]?.action}</p>
        {event.order && <Link className="mt-3 inline-block text-sm text-brand-blue underline" href={`/admin/book-orders/${encodeURIComponent(event.order.id)}/shipping`}>Open order {event.order.reference}</Link>}
        <dl className="mt-4 space-y-2 text-sm text-gray-400">
          <div><dt className="inline">Carrier update: </dt><dd className="inline text-gray-200">{event.description || "Unrecognized code — review with Aramex"} ({event.code}{event.problemCode ? ` / ${event.problemCode}` : ""})</dd></div>
          <div><dt className="inline">Event time (UTC): </dt><dd className="inline">{new Date(event.occurredAt).toISOString().replace("T", " ")}</dd></div>
          <div><dt className="inline">Received (UTC): </dt><dd className="inline">{new Date(event.receivedAt).toISOString().replace("T", " ")}</dd></div>
          {event.location && <div><dt className="inline">Location: </dt><dd className="inline">{event.location}</dd></div>}
          {event.orderNumber && <div><dt className="inline">Carrier order reference (unverified): </dt><dd className="inline">{event.orderNumber}</dd></div>}
        </dl>
        {event.comments && <details className="mt-3 text-sm text-gray-300"><summary className="cursor-pointer">Carrier notes</summary><p className="mt-2 whitespace-pre-wrap">{event.comments}</p></details>}
      </article>)}</div>
      {data.totalPages > 1 && <nav aria-label="Tracking inbox pages" className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-300">
        <button className={button} disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button>
        <span>Page {data.page} of {data.totalPages}</span>
        <button className={button} disabled={page >= data.totalPages} onClick={() => setPage(value => value + 1)}>Next</button>
      </nav>}
    </>}
  </div>;
}
