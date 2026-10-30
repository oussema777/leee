'use client';
import { useEffect, useRef, useState } from 'react';
import { WhishHostedCheckout } from './WhishHostedCheckout';
export function WhishReviewer() {
  const [token, setToken] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<{ reference: string; token: string; amountCents: number } | null>(null);
  const requestId = useRef('');
  const validToken = /^[a-f0-9]{64}$/.test(token);
  function readToken(value: string) {
    const fragment = value.includes('#') ? value.slice(value.indexOf('#') + 1) : value;
    try { return decodeURIComponent(fragment).trim(); } catch { return fragment.trim(); }
  }
  useEffect(() => {
    const sync = () => { setToken(readToken(location.hash)); setError(''); };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  async function create() {
    if (busy) return;
    if (!validToken) { setError('Paste the complete review link below, including the access code after #.'); return; }
    setBusy(true); setError('');
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
    <button className="cursor-pointer rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-40" disabled={busy} onClick={create}>{busy ? 'Preparing…' : order ? 'Create another test order' : 'Create test order'}</button>
    {!validToken && <div className="mt-4">
      <label htmlFor="review-link" className="block font-semibold">Complete review link</label>
      <p id="review-link-help" className="my-2">This link is missing a valid access code. Paste the complete link supplied by LEE, including everything after #.</p>
      <input id="review-link" type="text" autoComplete="off" spellCheck={false} aria-describedby="review-link-help" className="w-full rounded-lg border border-slate-400 bg-white p-3 text-slate-900" placeholder="Paste your review link" onChange={event => {
        const next = readToken(event.target.value);
        setToken(next); setError('');
        if (/^[a-f0-9]{64}$/.test(next)) history.replaceState(null, '', '#' + next);
      }} />
    </div>}
    {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
    {order && <WhishHostedCheckout key={order.reference} endpoint={'/api/public/book-orders/' + order.reference + '/whish-pay'} token={order.token} reference={order.reference} amountCents={order.amountCents} locale="en" />}
  </main>;
}
