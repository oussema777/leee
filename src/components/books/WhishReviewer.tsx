'use client';
import { useEffect, useRef, useState } from 'react';
import { WhishHostedCheckout } from './WhishHostedCheckout';
export function WhishReviewer() {
  const [token, setToken] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<{ reference: string; token: string; amountCents: number } | null>(null);
  const requestId = useRef('');
  useEffect(() => { setToken(location.hash.slice(1)); }, []);
  async function create() {
    if (busy) return; setBusy(true); setError('');
    try {
      requestId.current ||= crypto.randomUUID();
      const r = await fetch('/api/whish-test', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ requestId: requestId.current }) });
      const data = await r.json(); if (!r.ok) throw Error(data.error);
      localStorage.setItem('whish-access:' + data.reference, data.token);
      setOrder(data); requestId.current = '';
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to start test.'); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-2xl px-4 py-12">
    <h1 className="text-3xl font-bold">Whish Pay integration review</h1>
    <p className="my-5">Sandbox only. Create a $1.00 test, then open Whish and choose Simulate Success or Simulate Failure. No real money or delivery is involved.</p>
    <button className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-40" disabled={busy || !/^[a-f0-9]{64}$/.test(token)} onClick={create}>{busy ? 'Preparing…' : order ? 'Create another test order' : 'Create test order'}</button>
    {!token && <p className="mt-4">Use the complete review link supplied by LEE.</p>}
    {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
    {order && <WhishHostedCheckout key={order.reference} endpoint={'/api/public/book-orders/' + order.reference + '/whish-pay'} token={order.token} reference={order.reference} amountCents={order.amountCents} locale="en" />}
  </main>;
}
