"use client";
import { PaymentWaitStatus } from './PaymentWaitStatus';
import { paymentResultHint } from '@/lib/cybersource/result-hint';
import { useCallback, useEffect, useRef, useState } from 'react';

type Attempt = { id: string; state: string; transactionId: string | null; expiresAt: string | null };
type Session = { sessionJwt: string; clientLibrary: string; clientLibraryIntegrity: string };
type Reply = { attempt?: Attempt | null; session?: Session | null; completed?: boolean; pending?: boolean; retryAfterSeconds?: number };
export function CustomerCardCheckout({ endpoint, token, reference, amountCents, locale, readingUrl }: { endpoint: string; token?: string; reference: string; amountCents: number; locale: string; readingUrl?: string }) {
  const ar = locale === 'ar';
  const [attempt, setAttempt] = useState<Attempt | null>(null), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [completed, setCompleted] = useState(false), [error, setError] = useState('');
  const alive = useRef(true), running = useRef(false), dispose = useRef<() => void>(() => {});
  const [hasResult, setHasResult] = useState(false), [retryAt, setRetryAt] = useState<number | null>(null);
  const resultHint = useRef<{ attemptId?: string; transactionId?: string; nextCheckAt?: number } | null>(null);
  const [phase, setPhase] = useState<'opening' | 'checking' | 'card' | null>('checking');
  const savedKey = 'audi-result:' + reference;
  const call = useCallback(async (data: unknown): Promise<Reply> => {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(data), cache: 'no-store' });
    const result = await response.json(); if (!response.ok) throw Error(result.error || 'Checkout unavailable.');
    if (alive.current) {
      if ('attempt' in result) setAttempt(result.attempt);
      if (result.pending) {
        const nextCheckAt = Date.now() + 300000;
        setRetryAt(nextCheckAt); setHasResult(true);
        if (resultHint.current) resultHint.current.nextCheckAt = nextCheckAt;
        try { const saved = resultHint.current || JSON.parse(sessionStorage.getItem(savedKey) || 'null'); if (saved) sessionStorage.setItem(savedKey, JSON.stringify({ ...saved, nextCheckAt })); } catch {}
      }
      if (result.completed || result.attempt?.state === 'TEST_DECLINED') {
        setRetryAt(null); setHasResult(false); resultHint.current = null;
        try { sessionStorage.removeItem(savedKey); } catch {}
      }
      if (result.completed) setCompleted(true);
    }
    return result;
  }, [endpoint, token, savedKey]);
  const refresh = useCallback(async (force = false) => {
    if (running.current) return; running.current = true; setBusy(true); setError(''); setPhase('checking');
    try {
      let result = await call({ action: 'inspect' });
      let saved: { attemptId?: string; transactionId?: string; nextCheckAt?: number } | null = resultHint.current;
      try { saved = saved || JSON.parse(sessionStorage.getItem(savedKey) || 'null'); } catch {}
      resultHint.current = saved;
      const transactionId = result.attempt?.transactionId || (saved?.attemptId === result.attempt?.id ? saved?.transactionId : null);
      if (!result.completed && result.attempt && transactionId && result.attempt.state !== 'TEST_DECLINED') {
        if (alive.current) setHasResult(true);
        if (!force && saved?.attemptId === result.attempt.id && saved.nextCheckAt && saved.nextCheckAt > Date.now()) {
          if (alive.current) setRetryAt(saved.nextCheckAt);
        } else result = await call({ action: 'result', attemptId: result.attempt.id, transactionId });
      }
      if (alive.current) setLoaded(true);
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Could not refresh payment.'); }
    finally { running.current = false; if (alive.current) { setBusy(false); setPhase(null); } }
  }, [call, savedKey]);
  useEffect(() => { alive.current = true; void refresh(); return () => { alive.current = false; dispose.current(); }; }, [refresh]);
  useEffect(() => {
    if (!retryAt || completed) return;
    const timer = setTimeout(() => { setRetryAt(null); void refresh(); }, Math.max(0, retryAt - Date.now()));
    return () => clearTimeout(timer);
  }, [retryAt, completed, refresh]);
  async function open() {
    if (running.current) return; running.current = true; setBusy(true); setError(''); setPhase('opening');
    try {
      const result = await call({ action: 'start', retry: !!attempt && ['SESSION_FAILED', 'TEST_DECLINED'].includes(attempt.state) });
      if (!result.session || !result.attempt || !alive.current) return;
      const session = result.session;
      const url = new URL(session.clientLibrary);
      if (url.origin !== 'https://testup.cybersource.com' || !url.pathname.startsWith('/uc/') || !/^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$/.test(session.clientLibraryIntegrity)) throw Error('Invalid secure card form.');
      await new Promise<void>((resolve, reject) => {
        const existing = document.getElementById('audi-checkout-sdk') as HTMLScriptElement | null;
        if (existing?.src === session.clientLibrary && existing.integrity === session.clientLibraryIntegrity && window.VAS) return resolve();
        existing?.remove(); const script = document.createElement('script'); script.id = 'audi-checkout-sdk';
        script.src = session.clientLibrary; script.integrity = session.clientLibraryIntegrity; script.crossOrigin = 'anonymous';
        const timeout = setTimeout(() => { script.remove(); reject(Error('The card form took too long to load. Refresh to resume.')); }, 20000);
        script.onload = () => { clearTimeout(timeout); resolve(); }; script.onerror = () => { clearTimeout(timeout); reject(Error('Could not load the secure card form.')); }; document.head.appendChild(script);
      });
      if (!alive.current) return;
      if (!window.VAS) throw Error('The card form is unavailable.');
      const client = await window.VAS.UnifiedCheckout(session.sessionJwt);
      dispose.current = () => { try { client.destroy(); } catch {} };
      if (!alive.current) { dispose.current(); return; }
      const checkout = await client.createCheckout({ autoProcessing: true });
      dispose.current = () => { try { checkout.destroy(); } catch {} try { client.destroy(); } catch {} };
      if (!alive.current) { dispose.current(); return; }
      setPhase('card');
      const completion = await checkout.mount({ paymentSelection: '#customer-card-options', paymentScreen: '#customer-card-screen' });
      if (!alive.current) return;
      setPhase('checking');
      const transactionId = paymentResultHint(completion);
      if (!transactionId) throw Error('Payment needs verification.');
      setHasResult(true);
      resultHint.current = { attemptId: result.attempt.id, transactionId };
      try { sessionStorage.setItem(savedKey, JSON.stringify({ attemptId: result.attempt.id, transactionId })); } catch {}
      await call({ action: 'result', attemptId: result.attempt.id, transactionId });
    } catch { if (alive.current) setError(ar ? 'تعذّر تأكيد الدفع. حدّث الحالة قبل المحاولة مجدداً.' : 'Payment is not confirmed yet. Refresh the status before trying again. If you closed the form, you can resume it while it is valid.'); }
    finally { dispose.current(); running.current = false; if (alive.current) { setBusy(false); setPhase(null); } }
  }
  const retryable = !hasResult && (!attempt || ['SESSION_FAILED', 'TEST_DECLINED'].includes(attempt.state) || attempt.state === 'READY' && !!attempt.expiresAt && Date.parse(attempt.expiresAt) > Date.now());
  return <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 sm:p-8" dir={ar ? 'rtl' : 'ltr'}>
    <h1 className="text-2xl font-bold">{completed ? (ar ? 'اكتمل طلبك التجريبي' : 'Your test order is confirmed') : (ar ? 'الدفع بالبطاقة' : 'Pay by card')}</h1>
    <p className="mt-3 break-all text-sm text-slate-600">{reference}</p><p className="mt-2 text-xl font-semibold">USD {(amountCents / 100).toFixed(2)}</p>
    <p className="my-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{ar ? 'الدفع التجريبي: استخدم بطاقة اختبار فقط. لن يتم خصم أموال حقيقية.' : 'Test checkout: use a test card only. No real money is collected.'}</p>
    {!completed && (phase === 'opening' || phase === 'checking' || retryAt) && phase !== 'card' && <PaymentWaitStatus key={phase || 'waiting'} phase={phase} retryAt={retryAt} ar={ar} />}
    {completed ? <div role="status"><p>{ar ? 'تم التحقق من الدفع التجريبي بنجاح.' : 'Your test payment was verified successfully.'}</p>{readingUrl ? <a href={readingUrl} className="mt-5 inline-block rounded-xl bg-brand-blue px-6 py-3 font-bold text-white">{ar ? 'اقرأ كتابك' : 'Read your ebook'}</a> : <p className="mt-3 text-sm text-slate-600">{ar ? 'هذا طلب تجريبي ولن يتم شحنه.' : 'This is a test order and will not be shipped.'}</p>}</div> : <>
      {attempt?.state === 'TEST_DECLINED' && <p role="status">{ar ? 'تم رفض البطاقة. يمكنك المحاولة ببطاقة اختبار أخرى.' : 'The test card was declined. You can try another test card.'}</p>}
      {attempt && !retryable && !retryAt && !phase && <p role="status">{ar ? 'الدفع بانتظار التأكيد. لا تدفع مجدداً؛ حدّث الحالة أو تواصل معنا.' : 'Payment is awaiting confirmation. Do not pay again; refresh the status or contact LEE.'}</p>}
      {loaded && retryable && <button onClick={() => void open()} disabled={busy} className="mt-4 rounded-xl bg-brand-blue px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? (ar ? 'جارٍ فتح الدفع…' : 'Checkout in progress…') : attempt?.state === 'READY' ? (ar ? 'متابعة الدفع' : 'Resume card checkout') : (ar ? 'متابعة إلى البطاقة' : 'Continue to card payment')}</button>}
      <div id="customer-card-options" className="mt-5" /><div id="customer-card-screen" className="mt-3" />
    </>}
    {!completed && <button onClick={() => void refresh(true)} disabled={busy} className="mt-5 block rounded-lg border border-slate-300 px-4 py-3 text-sm disabled:opacity-50">{busy ? (ar ? 'يرجى الانتظار…' : 'Please wait…') : (ar ? 'تحقق الآن' : 'Check now')}</button>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <a href="https://wa.me/9613600747" className="mt-5 inline-block text-sm underline">{ar ? 'مساعدة بشأن الدفع' : 'Payment support'}</a>
  </section>;
}
