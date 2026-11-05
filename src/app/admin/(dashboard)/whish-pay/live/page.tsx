'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminGet, adminPost } from '@/lib/admin-api';
type Attempt = { id: string; reference: string; kind: 'BOOK' | 'EBOOK'; orderId: string; amountCents: number; status: string; applied: boolean; refundApplied: boolean; reviewReason: string | null; checkedAt: string | null; errorCode: string | null };
type Setup = { configured: boolean; enabled: boolean; refundsEnabled: boolean; attempts: Attempt[] };
export default function WhishLivePayments() {
  const [data, setData] = useState<Setup | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [refund, setRefund] = useState<Attempt | null>(null), [reason, setReason] = useState(''), [confirmed, setConfirmed] = useState(false);
  const refresh = useCallback(async () => { setData(await adminGet<Setup>('/whish-pay/live')); }, []);
  useEffect(() => { void refresh().catch(() => setError('Could not load live payments.')); }, [refresh]);
  async function action(a: Attempt, kind: 'check' | 'refund') {
    setBusy(true); setError('');
    try {
      const result = await adminPost<{ refunded?: boolean }>('/whish-pay/live/' + a.id, kind === 'check' ? { action: kind } : { action: kind, reason, expectedAmountCents: a.amountCents, confirmed });
      if (kind === 'refund' && !result.refunded) setError('The refund is not yet confirmed. Check the payment status before retrying.');
      setRefund(null); setReason(''); setConfirmed(false); await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  const button = 'rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-40';
  return <main className="mx-auto max-w-4xl space-y-6 text-white">
    <Link className="text-blue-300 underline" href="/admin/payment-methods">Payment methods</Link>
    <h1 className="text-3xl font-bold">Whish payments</h1>
    <p className="text-gray-300">Production payments, fulfillment and refund status.</p>
    <section className="space-y-3 rounded-2xl border border-gray-700 bg-slate-800 p-5">
      <p>{!data ? 'Loading…' : data.enabled ? 'Live checkout enabled.' : 'New live payments disabled.'}</p>
      {data && !data.configured && <p>Production credentials are not configured in this environment.</p>}
      {data && !data.refundsEnabled && <p className="text-sm text-gray-300">Refund requests are disabled until Whish confirms the server’s outgoing IP is allowlisted. Refunds performed by Whish are reconciled through payment status checks.</p>}
      <button className={button} disabled={busy} onClick={() => void refresh().catch(() => setError('Could not refresh payments.'))}>Refresh records</button>
      <Link href="/admin/whish-pay" className="ms-4 text-blue-300 underline">Sandbox tests</Link>
    </section>
    {error && <p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-200">{error}</p>}
    {data?.attempts.length === 0 && <p>No live Whish payments yet.</p>}
    {data?.attempts.map(a => <section key={a.id} className="space-y-3 rounded-2xl border border-gray-700 bg-slate-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><Link className="break-all text-blue-300 underline" href={`/admin/${a.kind === 'BOOK' ? 'book-orders' : 'ebook-orders'}/${a.orderId}`}>{a.reference}</Link><strong>${(a.amountCents / 100).toFixed(2)} USD</strong></div>
      <p>{a.status} · {a.refundApplied ? 'Refund applied' : a.applied ? 'Order confirmed' : 'Not fulfilled'}</p>
      {a.reviewReason && <p className="text-amber-200">Staff review required: {a.reviewReason}. Check the order before arranging fulfillment or another payment.</p>}
      <p className="text-sm text-gray-400">{a.checkedAt ? 'Last verified: ' + new Date(a.checkedAt).toLocaleString() : 'Not verified yet'}</p>
      {a.errorCode && <p className="text-amber-200">Provider response: {a.errorCode}</p>}
      <div className="flex flex-wrap gap-3"><button className={button} disabled={busy} onClick={() => void action(a, 'check')}>Verify with Whish</button>
        {data.refundsEnabled && a.status === 'success' && <button className={button} disabled={busy} onClick={() => { setRefund(a); setReason(''); setConfirmed(false); }}>Refund payment</button>}
      </div>
      {refund?.id === a.id && <form className="space-y-3 rounded-xl border border-amber-500/40 p-4" onSubmit={event => { event.preventDefault(); void action(a, 'refund'); }}>
        <p>Refund ${(a.amountCents / 100).toFixed(2)} USD for {a.reference}.</p>
        <label className="block">Reason<input required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} className="mt-2 block w-full rounded-lg border border-gray-600 bg-slate-900 p-3" /></label>
        <label className="flex gap-3"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />I checked the order and shipment, and confirm this refund.</label>
        <button className={button} disabled={busy || !confirmed || !reason.trim()}>Confirm refund</button>
        <button type="button" className="ms-4 underline" onClick={() => setRefund(null)}>Cancel</button>
      </form>}
    </section>)}
  </main>;
}
