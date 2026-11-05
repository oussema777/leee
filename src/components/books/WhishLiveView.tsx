'use client';
import type { WhishCheckoutResult } from './WhishHostedCheckout';
export function WhishLiveView({ result, busy, error, autoStopped, reference, amountCents, locale, readingUrl, call }: {
  result: WhishCheckoutResult | null; busy: boolean; error: string; autoStopped: boolean; reference: string; amountCents: number; locale: string; readingUrl?: string;
  call: (action: 'start' | 'check' | 'retry') => Promise<void>;
}) {
  const ar = locale === 'ar', t = (en: string, arabic: string) => ar ? arabic : en;
  const a = result?.attempt, review = a?.reviewRequired, refunded = a?.status === 'refunded';
  const button = 'inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50';
  return <section dir={ar ? 'rtl' : 'ltr'} className="mx-auto my-10 max-w-xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
    <p className="text-sm font-semibold text-blue-700">{t('Secure payment with Whish', 'دفع آمن عبر Whish')}</p>
    <h1 className="text-2xl font-bold">{result?.completed ? t('Payment confirmed', 'تم تأكيد الدفع') : refunded ? t('Payment refunded', 'تم استرداد المبلغ') : review ? t('We are reviewing your payment', 'نراجع دفعتك') : t('Pay with Whish', 'الدفع عبر Whish')}</h1>
    <p className="break-all text-sm text-slate-500">{reference}</p>
    <p className="text-3xl font-bold">${(amountCents / 100).toFixed(2)} <span className="text-base">USD</span></p>
    {result?.completed ? <><p role="status">{t('Whish confirmed your payment. Your order is confirmed.', 'أكدت Whish استلام دفعتك وتم تأكيد طلبك.')}</p>{readingUrl && <a className={button} href={readingUrl}>{t('Read your ebook', 'اقرأ كتابك الإلكتروني')}</a>}</> : refunded ? <p role="status">{t('Whish confirmed your refund. Contact LEE if you need help.', 'أكدت Whish استرداد المبلغ. تواصل مع LEE إذا احتجت إلى مساعدة.')}</p> : review ? <p role="status">{t('Your payment needs a staff review. Please do not pay again. Contact LEE with the order reference above.', 'تحتاج دفعتك إلى مراجعة من فريقنا. لا تدفع مرة أخرى. تواصل مع LEE مع ذكر رقم الطلب أعلاه.')}</p> : <>
      <p>{t('Open Whish, then scan the QR code or enter the payment code in your Whish app. We confirm your payment automatically; no receipt upload is needed.', 'افتح صفحة Whish ثم امسح رمز QR أو أدخل رمز الدفع في تطبيق Whish. نؤكد الدفع تلقائياً ولا تحتاج إلى رفع إيصال.')}</p>
      <div className="flex flex-wrap gap-3">
        {!a && <button className={button} disabled={busy || !result} onClick={() => void call('start')}>{t('Continue to Whish', 'متابعة إلى Whish')}</button>}
        {a?.collectUrl && !['failed', 'success', 'refunded'].includes(a.status) && <a className={button} href={a.collectUrl} target="_blank" rel="noopener noreferrer">{t('Open Whish payment', 'افتح صفحة الدفع')}</a>}
        {(a || error) && <button className={button} disabled={busy} onClick={() => void call('check')}>{t('Check payment status', 'تحقق من حالة الدفع')}</button>}
        {a && !a.collectUrl && !result?.retryAllowed && <button className={button} disabled={busy} onClick={() => void call('start')}>{t('Recover payment link', 'استعادة رابط الدفع')}</button>}
        {result?.retryAllowed && <button className={button} disabled={busy} onClick={() => void call('retry')}>{t('Create a new payment link', 'إنشاء رابط دفع جديد')}</button>}
      </div>
      {a && <p role="status">{a.status === 'failed' ? t('This link expired unpaid. You can create a new link.', 'انتهت صلاحية الرابط دون دفع. يمكنك إنشاء رابط جديد.') : t('Waiting for Whish confirmation. Please do not pay twice.', 'بانتظار تأكيد Whish. لا تدفع مرتين.')}</p>}
      {a?.errorCode && <p role="alert">{t('We could not finish creating the payment link. Recover the same link or contact LEE before trying another payment.', 'تعذر إتمام إنشاء رابط الدفع. استعد الرابط نفسه أو تواصل مع LEE قبل محاولة دفع أخرى.')}</p>}
      {autoStopped && <p>{t('Automatic checking paused. Use Check payment status to continue.', 'توقف التحقق التلقائي. استخدم زر التحقق من حالة الدفع للمتابعة.')}</p>}
    </>}
    {busy && <p role="status">{t('Checking…', 'جارٍ التحقق…')}</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {(review || refunded || error) && <a className="inline-flex min-h-11 items-center text-blue-700 underline" href={`/${ar ? 'ar' : 'en'}/contact`}>{t('Contact LEE', 'تواصل مع LEE')}</a>}
  </section>;
}
