'use client';
import { useEffect, useRef, useState } from 'react';
import { CustomerCardCheckout } from './CustomerCardCheckout';
type Order = { reference: string; token: string; amountCents: number };
export function ReviewerCheckout() {
  const [token, setToken] = useState(''), [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const requestId = useRef('');
  const running = useRef(false);
  useEffect(() => {
    const value = window.location.hash.slice(1);
    setToken(/^[a-f0-9]{64}$/.test(value) ? value : ''); setReady(true);
    try { requestId.current = sessionStorage.getItem('payment-review:' + value) || ''; } catch {}
  }, []);
  async function prepare(fresh = false) {
    if (running.current) return;
    running.current = true; setBusy(true); setError('');
    if (fresh || !requestId.current) requestId.current = crypto.randomUUID();
    try {
      try { sessionStorage.setItem('payment-review:' + token, requestId.current); } catch {}
      const response = await fetch('/api/payment-test', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ requestId: requestId.current }), cache: 'no-store', signal: AbortSignal.timeout(30000) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Unable to prepare checkout.');
      setOrder(result);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to prepare checkout.'); }
    finally { running.current = false; setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-36 text-slate-900">
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">The LEE Experience · Areeba review</p>
      <h1 className="mt-3 text-3xl font-bold">Payment integration test</h1>
      <p className="mt-4 leading-relaxed text-slate-600">Test our card checkout using the Areeba / Cybersource TEST outlet. Each test is USD 1.00. Use sandbox card details only; no real payment or shipment is created.</p>
      {!ready ? <p className="mt-6">Loading…</p> : !token ? <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-amber-900">Open the complete private review link supplied by LEE.</p> : <>
        <div className="my-6 flex flex-wrap gap-3">
          {!order && <button disabled={busy} onClick={() => void prepare()} className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Preparing checkout…' : 'Open test checkout'}</button>}
          {order && <button disabled={busy} onClick={() => void prepare(true)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold disabled:opacity-50">{busy ? 'Preparing checkout…' : 'Start a separate test'}</button>}
        </div>
        {error && <p role="alert" className="my-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
        {order && <CustomerCardCheckout key={order.reference} endpoint={'/api/public/book-orders/' + encodeURIComponent(order.reference) + '/card'} token={order.token} reference={order.reference} amountCents={order.amountCents} locale="en" />}
        <p className="mt-6 text-sm text-slate-500">No account is required. You can return to this link to resume the current test in this tab, or start a separate test for another card or authentication scenario.</p>
      </>}
    </div>
  </main>;
}
