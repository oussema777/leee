'use client';
import { WhishLiveView } from './WhishLiveView';
import { useCallback, useEffect, useRef, useState } from 'react';
export type WhishCheckoutResult = { completed: boolean; retryAllowed: boolean; attempt: { id: string; status: string; collectUrl: string | null; errorCode: string | null; uncertain: boolean; reviewRequired?: boolean } | null };
export function WhishHostedCheckout({ endpoint, token, reference, amountCents, locale, readingUrl, live = false }: { endpoint: string; token?: string; reference: string; amountCents: number; locale: string; readingUrl?: string; live?: boolean }) {
  const ar = locale === 'ar';
  const [result, setResult] = useState<WhishCheckoutResult | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [autoStopped, setAutoStopped] = useState(false);
  const inFlight = useRef(false);
  const call = useCallback(async (action: 'start' | 'check' | 'retry') => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify({ action }) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Unable to verify payment.');
      setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to verify payment.'); }
    finally { inFlight.current = false; setBusy(false); }
  }, [endpoint, token]);
  useEffect(() => { void call('check'); }, [call]);
  useEffect(() => {
    if (!result?.attempt || result.completed || result.attempt.reviewRequired || ['failed', 'refunded'].includes(result.attempt.status)) return;
    const start = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - start > 6 * 60000) { clearInterval(timer); setAutoStopped(true); return; }
      if (document.visibilityState === 'visible') void call('check');
    }, 10000);
    const focus = () => { void call('check'); };
    window.addEventListener('focus', focus);
    return () => { clearInterval(timer); window.removeEventListener('focus', focus); };
  }, [result?.attempt?.id, result?.completed, result?.attempt?.status, result?.attempt?.reviewRequired, call]);
  if (live) return <WhishLiveView result={result} busy={busy} error={error} autoStopped={autoStopped} reference={reference} amountCents={amountCents} locale={locale} readingUrl={readingUrl} call={call} />;
  const button = 'inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50';
  const a = result?.attempt;
  return <section dir={ar ? 'rtl' : 'ltr'} className="mx-auto my-10 max-w-xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
    <p className="text-sm font-bold text-amber-700">{ar ? 'اختبار Whish — بدون أموال حقيقية أو شحن' : 'Whish sandbox · no real money or shipping'}</p>
    <h1 className="text-2xl font-bold">{result?.completed ? (ar ? 'تم تأكيد دفع الاختبار' : 'Test payment confirmed') : (ar ? 'الدفع عبر Whish' : 'Pay with Whish')}</h1>
    <p className="break-all text-sm text-slate-500">{reference}</p>
    <p className="text-3xl font-bold">${(amountCents / 100).toFixed(2)} <span className="text-base">USD</span></p>
    {result?.completed ? <><p role="status">{ar ? 'تم التحقق من الدفع لدى Whish وتأكيد طلب الاختبار.' : 'Whish verified your payment and the test order is confirmed.'}</p>{readingUrl && <a className={button} href={readingUrl}>{ar ? 'اقرأ الكتاب' : 'Read ebook'}</a>}</> : <>
      <p>{ar ? 'افتح صفحة Whish لإتمام الاختبار. سنتحقق من النتيجة تلقائياً. لا يلزم رفع إيصال.' : 'Open the Whish payment page to complete the test. We verify the result automatically; no receipt upload is needed.'}</p>
      <div className="flex flex-wrap gap-3">
        {!a && <button className={button} disabled={busy || !result} onClick={() => call('start')}>{ar ? 'إنشاء رابط دفع Whish' : 'Create Whish payment link'}</button>}
        {a?.collectUrl && !['failed', 'success', 'refunded'].includes(a.status) && <a className={button} href={a.collectUrl} target="_blank" rel="noopener noreferrer">{ar ? 'افتح صفحة Whish' : 'Open Whish payment'}</a>}
        {(a || error) && <button className={button} disabled={busy} onClick={() => call('check')}>{ar ? 'تحقق من حالة الدفع' : 'Check payment status'}</button>}
        {a && !a.collectUrl && !result?.retryAllowed && <button className={button} disabled={busy} onClick={() => call('start')}>{ar ? 'استعادة رابط الدفع' : 'Recover payment link'}</button>}
        {result?.retryAllowed && <button className={button} disabled={busy} onClick={() => call('retry')}>{ar ? 'إنشاء رابط جديد' : 'Create a new payment link'}</button>}
      </div>
      {a && <p role="status">{a.status === 'failed' ? (ar ? 'انتهت صلاحية الدفع دون نجاح. يمكنك إنشاء رابط جديد.' : 'This payment expired unpaid. You can create a new link.') : a.status === 'refunded' ? (ar ? 'تم استرداد الدفع.' : 'This payment was refunded.') : (ar ? 'بانتظار تأكيد الدفع من Whish. لا تدفع مرتين.' : 'Waiting for Whish confirmation. Do not pay twice.')}</p>}
      {a?.errorCode && <p role="alert" className="text-amber-800">{a.errorCode}. {a.uncertain ? 'Recover the same payment link before trying again.' : 'Check the test account configuration.'}</p>}
      {autoStopped && <p>{ar ? 'توقف التحقق التلقائي. استخدم زر التحقق من الحالة.' : 'Automatic checking has paused. Use Check payment status to check again.'}</p>}
    </>}
    {busy && <p role="status">{ar ? 'جارٍ التحقق…' : 'Checking…'}</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </section>;
}
