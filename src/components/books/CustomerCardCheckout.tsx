"use client";
import { Check } from 'lucide-react';
import { PaymentWaitStatus } from './PaymentWaitStatus';
import { paymentResultHint } from '@/lib/cybersource/result-hint';
import { CUSTOMER_CHECK_SECONDS } from '@/lib/cybersource/polling';
import { useCallback, useEffect, useRef, useState } from 'react';

type Attempt = { id: string; state: string; transactionId: string | null; expiresAt: string | null };
type Session = { sessionJwt: string; clientLibrary: string; clientLibraryIntegrity: string };
type Reply = { attempt?: Attempt | null; session?: Session | null; completed?: boolean; pending?: boolean; retryAfterSeconds?: number };
export function CustomerCardCheckout({ endpoint, token, reference, amountCents, locale, readingUrl }: { endpoint: string; token?: string; reference: string; amountCents: number; locale: string; readingUrl?: string }) {
  const ar = locale === 'ar';
  const [attempt, setAttempt] = useState<Attempt | null>(null), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [completed, setCompleted] = useState(false), [error, setError] = useState('');
  const alive = useRef(true), running = useRef(false), dispose = useRef<() => void>(() => {});
  const [hasResult, setHasResult] = useState(false), [retryAt, setRetryAt] = useState<number | null>(null);
  const [retrySeconds, setRetrySeconds] = useState(CUSTOMER_CHECK_SECONDS);
  const resultHint = useRef<{ attemptId?: string; transactionId?: string; nextCheckAt?: number } | null>(null);
  const [phase, setPhase] = useState<'opening' | 'checking' | 'card' | null>('checking');
  const savedKey = 'audi-result:' + reference;
  const call = useCallback(async (data: unknown): Promise<Reply> => {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(data), cache: 'no-store' });
    const result = await response.json(); if (!response.ok) throw Error(result.error || 'Checkout unavailable.');
    if (alive.current) {
      if ('attempt' in result) setAttempt(result.attempt);
      if (result.pending) {
        const seconds = Number.isFinite(result.retryAfterSeconds) ? Math.min(30, Math.max(1, result.retryAfterSeconds)) : CUSTOMER_CHECK_SECONDS;
        const nextCheckAt = Date.now() + seconds * 1000;
        setRetrySeconds(seconds);
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
      let saved: { attemptId?: string; transactionId?: string; nextCheckAt?: number } | null = resultHint.current;
      try { saved = saved || JSON.parse(sessionStorage.getItem(savedKey) || 'null'); } catch {}
      resultHint.current = saved;
      let result = await call({ action: 'inspect', awaitingResult: !!saved?.attemptId });
      const transactionId = result.attempt?.transactionId || (saved?.attemptId === result.attempt?.id ? saved?.transactionId : null);
      if (!result.completed && !result.pending && result.attempt && transactionId && result.attempt.state !== 'TEST_DECLINED') {
        if (alive.current) setHasResult(true);
        if (!force && saved?.attemptId === result.attempt.id && saved.nextCheckAt && saved.nextCheckAt > Date.now()) {
          if (alive.current) setRetryAt(Math.min(saved.nextCheckAt, Date.now() + CUSTOMER_CHECK_SECONDS * 1000));
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
    let openedAttemptId: string | undefined;
    try {
      const result = await call({ action: 'start', retry: !!attempt && ['SESSION_FAILED', 'TEST_DECLINED'].includes(attempt.state) });
      if (!result.session || !result.attempt || !alive.current) return;
      openedAttemptId = result.attempt.id;
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
    } catch {
      if (alive.current && openedAttemptId) {
        // SDK rejection can mean cancelled 3DS, a decline, or lost completion.
        // Only the server decides whether retry is safe; keep checking visibly.
        setPhase('checking');
        resultHint.current = { attemptId: openedAttemptId };
        try { sessionStorage.setItem(savedKey, JSON.stringify(resultHint.current)); } catch {}
        try { await call({ action: 'inspect', awaitingResult: true }); }
        catch { setError(ar ? 'تعذّر التحقق من حالة الدفع. تحقق مجددًا قبل إعادة المحاولة.' : 'Could not check the payment status. Check again before trying another payment.'); }
      } else if (alive.current) setError(ar ? 'تعذّر فتح نموذج البطاقة. حاول مجددًا.' : 'Could not open the card form. Please try again.');
    }
    finally { dispose.current(); running.current = false; if (alive.current) { setBusy(false); setPhase(null); } }
  }
  const retryable = !hasResult && (!attempt || ['SESSION_FAILED', 'TEST_DECLINED'].includes(attempt.state) || attempt.state === 'READY' && !!attempt.expiresAt && Date.parse(attempt.expiresAt) > Date.now());
  return <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 sm:p-8" dir={ar ? 'rtl' : 'ltr'}>
    <h1 className={`text-2xl font-bold ${completed ? 'text-emerald-800' : ''}`}>{completed ? (ar ? 'اكتمل طلبك التجريبي' : 'Your test order is confirmed') : (ar ? 'الدفع بالبطاقة' : 'Pay by card')}</h1>
    <p className="mt-3 break-all text-sm text-slate-600">{reference}</p><p className="mt-2 text-xl font-semibold">USD {(amountCents / 100).toFixed(2)}</p>
    <p className="my-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{ar ? 'الدفع التجريبي: استخدم بطاقة اختبار فقط. لن يتم خصم أموال حقيقية.' : 'Test checkout: use a test card only. No real money is collected.'}</p>
    {!completed && (phase === 'opening' || phase === 'checking' || retryAt) && phase !== 'card' && <PaymentWaitStatus key={phase || 'waiting'} phase={phase} retryAt={retryAt} retrySeconds={retrySeconds} ar={ar} />}
    {completed ? <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
      <span aria-hidden="true" className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100"><Check size={30} strokeWidth={3} /></span>
      <h2 className="text-2xl font-bold text-emerald-800">{ar ? 'تم الدفع التجريبي بنجاح!' : 'Test payment successful!'}</h2>
      <p className="mt-2 leading-6 text-emerald-800">{ar ? 'تم التحقق من الدفع التجريبي بنجاح.' : 'Your test payment was verified successfully.'}</p>
      {readingUrl ? <a href={readingUrl} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">{ar ? 'اقرأ كتابك' : 'Read your ebook'}</a> : <p className="mt-3 text-sm text-emerald-800">{ar ? 'هذا طلب تجريبي ولن يتم شحنه.' : 'This is a test order and will not be shipped.'}</p>}
    </div> : <>
      {attempt?.state === 'TEST_DECLINED' && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
        <h2 className="text-lg font-bold">{ar ? 'لم تكتمل عملية الدفع' : 'Payment was not completed'}</h2>
        <p className="mt-2">{ar ? 'رُفضت عملية الدفع أو أُلغي التحقق من البطاقة أو لم ينجح. يمكنك إعادة المحاولة بأمان باستخدام بطاقة اختبار.' : 'The payment was declined, or card authentication was cancelled or unsuccessful. You can safely try again with a test card.'}</p>
      </div>}
      {attempt && !retryable && !retryAt && !phase && <p role="status">{ar ? 'الدفع بانتظار التأكيد. لا تدفع مجدداً؛ حدّث الحالة أو تواصل معنا.' : 'Payment is awaiting confirmation. Do not pay again; refresh the status or contact LEE.'}</p>}
      {loaded && retryable && <button onClick={() => void open()} disabled={busy} className="mt-4 rounded-xl bg-brand-blue px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? (ar ? 'جارٍ فتح الدفع…' : 'Checkout in progress…') : attempt?.state === 'READY' ? (ar ? 'متابعة الدفع' : 'Resume card checkout') : attempt?.state === 'TEST_DECLINED' ? (ar ? 'إعادة محاولة الدفع' : 'Try payment again') : (ar ? 'متابعة إلى البطاقة' : 'Continue to card payment')}</button>}
      <div id="customer-card-options" className="mt-5" /><div id="customer-card-screen" className="mt-3" />
    </>}
    {!completed && <button onClick={() => void refresh(true)} disabled={busy} className="mt-5 block rounded-lg border border-slate-300 px-4 py-3 text-sm disabled:opacity-50">{busy ? (ar ? 'يرجى الانتظار…' : 'Please wait…') : (ar ? 'تحقق الآن' : 'Check now')}</button>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <a href="https://wa.me/9613600747" className="mt-5 inline-block text-sm underline">{ar ? 'مساعدة بشأن الدفع' : 'Payment support'}</a>
  </section>;
}
