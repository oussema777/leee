'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminGet, adminPost } from '@/lib/admin-api';

type Attempt = { id: string; externalId: string; amount: string; createdAt: string; collectUrl: string | null;
  status: string; checkedAt: string | null; callbackAt: string | null; errorCode: string | null; uncertain: boolean };
type Setup = { configured: boolean; configurationError: string | null; attempts: Attempt[] };
export default function WhishPayPage() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => { setSetup(await adminGet<Setup>('/whish-pay')); }, []);
  useEffect(() => { refresh().catch(() => setError('Could not load sandbox setup. Reload this page.')); }, [refresh]);
  async function run(action: 'connection' | 'start' | 'check', id?: string) {
    setBusy(true); setError(''); setMessage('');
    try {
      // Preserve the request id across lost responses and reloads until the saved attempt is returned.
      const attemptId = action === 'start' ? id || sessionStorage.getItem('whish-pending-attempt') || crypto.randomUUID() : id;
      if (action === 'start') sessionStorage.setItem('whish-pending-attempt', attemptId!);
      const result = await adminPost<{ authenticated?: boolean; attempt?: Attempt }>('/whish-pay', { action, ...(attemptId ? { id: attemptId } : {}) });
      if (action === 'start') sessionStorage.removeItem('whish-pending-attempt');
      if (result.authenticated) setMessage('Connected to Whish sandbox. Credentials accepted.');
      if (result.attempt) setMessage(action === 'start' ? result.attempt.collectUrl ? 'Test saved. Open the payment page below to simulate an outcome.' : 'Test saved without a payment link. Review its status below.' : 'Verified with Whish: ' + result.attempt.status + '.');
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete the test.'); }
    finally { setBusy(false); }
  }
  const button = 'rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-40';
  return <div className="mx-auto max-w-4xl space-y-6 text-white">
    <Link href="/admin/payment-methods" className="text-blue-300 underline">Back to payment methods</Link>
    <div><span className="text-sm font-semibold text-amber-300">SANDBOX ONLY</span><h1 className="mt-2 text-3xl font-bold">Whish Pay integration test</h1>
      <p className="mt-3 text-gray-300">Test the hosted payment page, callbacks and payment verification with a simulated $1.00 payment. These tests do not confirm orders, reserve stock or unlock ebooks.</p></div>
    <section className="space-y-4 rounded-2xl border border-gray-700 bg-slate-800 p-6">
      <p>{!setup ? 'Loading setup…' : setup.configured ? 'Sandbox credentials are configured.' : 'Setup required: ' + setup.configurationError}</p>
      <div className="flex flex-wrap gap-3">
        <button className={button} disabled={busy || !setup?.configured} onClick={() => run('connection')}>Check connection</button>
        <button className={button} disabled={busy || !setup?.configured} onClick={() => run('start')}>Create $1.00 test</button>
        <button className={button} disabled={busy} onClick={() => refresh().catch(() => setError('Unable to refresh saved attempts.'))}>Refresh saved tests</button>
      </div>
      <p className="text-sm text-gray-300">Open the Whish payment page and select Simulate Success or Simulate Failure. Then check the status here. Payment links expire after five minutes; create a separate test for each outcome.</p>
      <p className="text-sm text-gray-300">A failed simulation may remain pending until the link expires. A browser redirect alone does not confirm payment.</p>
      {busy && <p role="status">Contacting Whish…</p>}
      {message && <p role="status" className="text-emerald-300">{message}</p>}
      {error && <p role="alert" className="text-red-300">{error}</p>}
    </section>
    <Link href="/admin/whish-pay/live" className="inline-flex text-blue-300 underline">Manage live Whish payments</Link>
    <h2 className="text-xl font-semibold">Recent test payments</h2>
    <section className="space-y-3 rounded-2xl border border-gray-700 bg-slate-800 p-5">
      <h2 className="text-xl font-semibold">Test a complete purchase</h2>
      <p className="text-sm text-gray-300">While signed in as a payment administrator, choose Whish sandbox at checkout. Printed test orders do not reserve stock or ship. Ebook tests unlock reading for your signed-in test reader after verified payment.</p>
      <div className="flex gap-5"><Link className="text-blue-300 underline" href="/en/books">Test printed books</Link><Link className="text-blue-300 underline" href="/en/ebooks">Test ebooks</Link></div>
    </section>
    {setup?.attempts.length === 0 && <p className="text-gray-400">No saved tests yet.</p>}
    {setup?.attempts.map(attempt => <section key={attempt.id} className="space-y-3 rounded-2xl border border-gray-700 bg-slate-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="font-semibold">${attempt.amount} USD · {attempt.status}</span><time className="text-sm text-gray-400">{new Date(attempt.createdAt).toLocaleString()}</time></div>
      <p className="break-all text-sm text-gray-400">{attempt.externalId}</p>
      <p className="text-sm">{attempt.checkedAt ? 'Last verified: ' + new Date(attempt.checkedAt).toLocaleString() : 'Status not checked yet.'} {attempt.callbackAt ? 'Callback received.' : 'No callback recorded yet.'}</p>
      {attempt.errorCode && <p role="status" className="text-amber-300">{attempt.errorCode}. {attempt.uncertain ? 'Outcome uncertain. Retry this saved request to recover the original link.' : 'Whish rejected this request. Check the account setup before creating another test.'}</p>}
      <div className="flex flex-wrap gap-3">
        {attempt.collectUrl && <a className={button} href={attempt.collectUrl} target="_blank" rel="noopener noreferrer">Open Whish test payment</a>}
        <button className={button} disabled={busy || !setup.configured} onClick={() => run('check', attempt.id)}>Check payment status</button>
        {!attempt.collectUrl && (attempt.uncertain || !attempt.errorCode) && <button className={button} disabled={busy || !setup.configured} onClick={() => run('start', attempt.id)}>Recover saved request</button>}
      </div>
    </section>)}
  </div>;
}
