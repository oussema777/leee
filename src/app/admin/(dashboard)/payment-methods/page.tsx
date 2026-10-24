"use client";
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { adminGet, adminPut } from '@/lib/admin-api';

type Method = 'WHISH' | 'BANK_AUDI' | 'CASH';
type Settings = { methods: Record<Method, boolean>; version: string | null };
const cards: { key: Method; title: string; description: string; setup?: string }[] = [
  { key: 'WHISH', title: 'Whish', description: 'QR payments for printed books and ebooks.', setup: '/admin/book-whish' },
  { key: 'BANK_AUDI', title: 'Bank Audi card payments', description: 'Card checkout for printed books and ebooks. Bank activation and configured testing permissions still apply.', setup: '/admin/book-bank-audi' },
  { key: 'CASH', title: 'Cash', description: 'Cash on delivery, at pickup or by arrangement for printed books.' },
];
export default function PaymentMethodsPage() {
  const [settings, setSettings] = useState<Settings | null>(null), [busy, setBusy] = useState<Method | 'load' | null>('load'), [error, setError] = useState(''), [message, setMessage] = useState('');
  const load = useCallback(async () => { setBusy('load'); setError(''); try { setSettings(await adminGet<Settings>('/payment-methods')); } catch { setError('Could not load payment methods. Refresh to try again.'); } finally { setBusy(null); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function toggle(key: Method) {
    if (!settings || busy) return;
    setBusy(key); setError(''); setMessage('');
    try {
      const next = await adminPut<Settings>('/payment-methods', { methods: { ...settings.methods, [key]: !settings.methods[key] }, version: settings.version });
      setSettings(next); setMessage(`${cards.find(c => c.key === key)!.title} ${next.methods[key] ? 'switched on. It appears when its setup is ready.' : 'switched off and hidden from new checkout.'}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save. Refresh to check the saved state.'); }
    finally { setBusy(null); }
  }
  return <div className="mx-auto max-w-3xl space-y-5 text-white">
    <h1 className="text-2xl font-bold sm:text-3xl">Payment methods</h1>
    <p className="text-slate-300">Control what customers can choose. Changes save immediately and apply to printed books and ebooks.</p>
    <p className="rounded-xl bg-slate-800 p-4 text-sm text-slate-300">Off hides the method and blocks new payments. Existing order history, payment verification and reports of money already sent remain available. Switching on keeps your saved receiving details.</p>
    {error && <p role="alert" className="rounded-xl bg-red-950 p-4 text-red-200">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-500 bg-emerald-950 p-4 text-emerald-100">{message}</p>}
    {!settings && busy && <p role="status">Loading payment methods...</p>}
    {settings && cards.map(card => <section key={card.key} className="rounded-2xl border border-slate-600 bg-slate-800 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{card.title}</h2><button role="switch" aria-checked={settings.methods[card.key]} aria-label={card.title} disabled={!!busy} onClick={() => void toggle(card.key)} className={`min-h-12 min-w-24 rounded-full px-5 py-2 font-bold disabled:opacity-50 ${settings.methods[card.key] ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-600 text-white'}`}>{busy === card.key ? 'Saving...' : settings.methods[card.key] ? 'On' : 'Off'}</button></div>
      <p className="mt-3 text-sm text-slate-300">{card.description}</p>
      <p className={`mt-2 text-sm font-medium ${settings.methods[card.key] ? 'text-emerald-300' : 'text-slate-300'}`}>{settings.methods[card.key] ? 'On - available when configured' : 'Off - hidden from checkout'}</p>
      {card.setup && <Link href={card.setup} className="mt-3 inline-block text-sm text-blue-300 underline">Receiving details and setup</Link>}
    </section>)}
    <button onClick={() => void load()} disabled={!!busy} className="min-h-11 rounded-lg border border-slate-500 px-4 py-2 disabled:opacity-50">Refresh saved settings</button>
  </div>;
}
