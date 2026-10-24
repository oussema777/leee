"use client";
import { useEffect, useState } from 'react';

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
export function PaymentWaitStatus({ phase, retryAt, retrySeconds, ar }: { phase: 'opening' | 'checking' | null; retryAt: number | null; retrySeconds: number; ar: boolean }) {
  const [startedAt] = useState(Date.now), [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const waiting = !phase && retryAt !== null;
  const remaining = Math.max(0, Math.ceil(((retryAt || now) - now) / 1000));
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  return <div className="my-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950" aria-label={ar ? 'حالة الدفع' : 'Payment progress'}>
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700 motion-reduce:animate-none" />
      <p role="status" className="font-semibold">{waiting ? (ar ? 'بانتظار تأكيد مزوّد الدفع' : 'Waiting for payment confirmation') : phase === 'opening' ? (ar ? 'جارٍ فتح نموذج البطاقة الآمن' : 'Opening the secure card form') : (ar ? 'نتحقق من حالة الدفع الآن' : 'Checking your payment now')}</p>
    </div>
    {waiting ? <>
      <p className="mt-3 text-sm leading-6">{ar ? 'مزوّد الدفع لم يُظهر تفاصيل العملية بعد. سنعيد التحقق تلقائياً؛ قد نحتاج إلى أكثر من محاولة.' : 'The payment provider has not published the result yet. We’ll check automatically; more than one check may be needed.'}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm"><span>{ar ? 'التحقق التلقائي التالي خلال' : 'Next automatic check in'}</span><strong data-payment-countdown dir="ltr" aria-live="off" className="tabular-nums">{clock(remaining)}</strong></div>
      <progress aria-label={ar ? 'الوقت حتى التحقق التالي' : 'Time until next automatic check'} max={retrySeconds} value={Math.max(0, retrySeconds - remaining)} className="mt-2 block h-2 w-full overflow-hidden rounded-full accent-blue-600" />
      <p className="mt-3 text-sm font-medium">{ar ? 'اترك الصفحة مفتوحة. لا حاجة لتحديثها ولا تدفع مرة أخرى.' : 'Keep this page open. No need to refresh, and do not pay again.'}</p>
    </> : <>
      <p className="mt-3 text-sm" aria-live="off">{ar ? 'الوقت المنقضي' : 'Time elapsed'} <strong data-payment-elapsed dir="ltr" className="ms-2 tabular-nums">{clock(elapsed)}</strong></p>
      <p className="mt-2 text-sm leading-6">{phase === 'opening' ? (ar ? 'ستظهر حقول البطاقة هنا. لا حاجة لتحديث الصفحة.' : 'The card fields will appear here. No need to refresh.') : (ar ? 'ننتظر رداً مؤكداً من مزوّد الدفع. سنُظهر النتيجة أو موعد التحقق التالي تلقائياً. لا تدفع مرة أخرى.' : 'We’re waiting for a verified response. Your result or the next check time will appear automatically. Do not pay again.')}</p>
    </>}
  </div>;
}
