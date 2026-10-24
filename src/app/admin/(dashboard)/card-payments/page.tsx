"use client";
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { adminGet, adminPost } from '@/lib/admin-api';
type Row = { id: string; bookOrderId: string | null; ebookOrderId: string | null; orderReference: string; amountCents: number; state: string; sessionState: string; transactionId: string | null; reviewReason: string | null; checkError: string | null; updatedAt: string; createdAt: string; mail: { id: string; event: string; state: string; lastError: string | null }[]; notes: { id: string; action: string; note: string; actorId: string; createdAt: string }[] };
type Data = { rows: Row[]; total: number; page: number; schedulerStale: boolean; liveEnabled: boolean; jobsEnabled: boolean; heartbeat: { state: string; finishedAt: string | null; startedAt: string } | null };
const human = (s: string) => s.replaceAll('_', ' ').toLowerCase();
export default function CardPaymentReview() {
  const [data, setData] = useState<Data | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [attention, setAttention] = useState(true), [page, setPage] = useState(1), [notes, setNotes] = useState<Record<string, string>>({}), [message, setMessage] = useState('');
  const load = useCallback(async () => { setBusy(true); setError(''); try { setData(await adminGet<Data>(`/card-payments?page=${page}&attention=${attention}`)); } catch { setError('Could not load payment review. Try refreshing.'); } finally { setBusy(false); } }, [page, attention]);
  useEffect(() => { void load(); }, [load]);
  async function act(row: Row, action: 'NOTE' | 'QUEUE_CHECK') {
    setBusy(true); setError(''); setMessage('');
    try { await adminPost('/card-payments', { attemptId: row.id, action, note: notes[row.id] || '', expectedUpdatedAt: row.updatedAt }); setNotes(n => ({ ...n, [row.id]: '' })); setMessage(action === 'NOTE' ? 'Note saved in the audit history.' : 'Payment queued for a background check. No new payment was started.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save. Refresh and try again.'); } finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-5xl space-y-5 text-white">
    <Link href="/admin/book-bank-audi" className="text-blue-300 underline">Bank Audi setup</Link>
    <h1 className="text-3xl font-bold">Card payment review</h1>
    <p className="text-slate-300">Review uncertain payments and delivery of confirmation emails. Payment is confirmed only from verified gateway evidence.</p>
    <div className="rounded-xl border border-slate-600 bg-slate-800 p-5">
      <p>Customer checkout: <strong>{data?.liveEnabled ? 'Enabled' : 'Disabled'}</strong>. Background checks: <strong>{data?.jobsEnabled ? 'Enabled' : 'Disabled'}</strong>.</p>
      <p className="mt-2 text-sm">Last background run: {data?.heartbeat ? `${human(data.heartbeat.state)} — ${new Date(data.heartbeat.finishedAt || data.heartbeat.startedAt).toLocaleString()}` : 'No run recorded'}</p>
      {data?.jobsEnabled && (data.schedulerStale || data.heartbeat?.state === 'FAILED') && <p role="alert" className="mt-3 rounded-lg bg-amber-950 p-3 text-amber-200">Background checks need attention. No recent successful run is confirmed; check scheduling and server logs.</p>}
    </div>
    <div className="flex flex-wrap items-center gap-4"><label><input type="checkbox" checked={attention} onChange={e => { setAttention(e.target.checked); setPage(1); }} /> Needs attention only</label><button disabled={busy} onClick={() => void load()} className="rounded-lg border px-4 py-2 disabled:opacity-50">{busy ? 'Loading…' : 'Refresh'}</button></div>
    {error && <p role="alert" className="rounded-lg bg-red-950 p-4 text-red-200">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-emerald-950 p-4 text-emerald-200">{message}</p>}
    {data?.rows.length === 0 && <p role="status" className="rounded-xl bg-slate-800 p-6">No payments in this view.</p>}
    {data?.rows.map(row => <article key={row.id} className="space-y-3 rounded-xl border border-slate-600 bg-slate-800 p-5">
      <div className="flex flex-wrap justify-between gap-3"><Link className="break-all font-bold text-blue-300 underline" href={`/admin/${row.bookOrderId ? 'book-orders/' + row.bookOrderId : 'ebook-orders/' + row.ebookOrderId}`}>{row.orderReference}</Link><strong>USD {(row.amountCents / 100).toFixed(2)}</strong></div>
      <p className="capitalize">Payment: {human(row.state)} · Checkout: {human(row.sessionState)}</p>
      {(row.reviewReason || row.checkError) && <p className="rounded-lg bg-amber-950 p-3 text-amber-200">Needs review: {human(row.reviewReason || row.checkError || '')}</p>}
      <p className="break-all text-sm text-slate-300">Transaction: {row.transactionId || 'Not verified'} · Created {new Date(row.createdAt).toLocaleString()}</p>
      {row.mail.map(m => <p key={m.id} className="text-sm">{human(m.event)} email: <strong>{human(m.state)}</strong>{m.lastError ? ' — ' + human(m.lastError) : ''}</p>)}
      <details><summary className="cursor-pointer text-blue-300">Recent staff notes ({row.notes.length})</summary>{row.notes.map(n => <div key={n.id} className="mt-3 border-slate-600 border-t pt-2"><p className="whitespace-pre-wrap break-words">{n.note}</p><p className="text-xs text-slate-400">{human(n.action)} · {n.actorId} · {new Date(n.createdAt).toLocaleString()}</p></div>)}</details>
      <label className="block text-sm">Review note — no card numbers, security codes or credentials<textarea aria-label={`Note for ${row.orderReference}`} maxLength={2000} value={notes[row.id] || ''} onChange={e => setNotes(n => ({ ...n, [row.id]: e.target.value }))} className="mt-2 block min-h-24 w-full rounded-lg border border-slate-500 bg-slate-900 p-3" /></label>
      <div className="flex flex-wrap gap-3"><button disabled={busy || (notes[row.id]?.trim().length || 0) < 5} onClick={() => void act(row, 'NOTE')} className="rounded-lg bg-blue-700 px-4 py-2 disabled:opacity-40">Save note</button>{['READY','VERIFIED_CAPTURE'].includes(row.state) && <button disabled={busy || !data.jobsEnabled || (notes[row.id]?.trim().length || 0) < 5} onClick={() => void act(row, 'QUEUE_CHECK')} className="rounded-lg border px-4 py-2 disabled:opacity-40">Queue payment check</button>}</div>
      <p className="text-xs text-slate-400">A note or queued check does not mark an order paid, reopen checkout, send a refund or release stock.</p>
    </article>)}
    {data && <div className="flex justify-between"><button disabled={busy || page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} · {data.total} payments</span><button disabled={busy || page * 25 >= data.total} onClick={() => setPage(p => p + 1)}>Next</button></div>}
  </div>;
}
