"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGet, adminPut } from "@/lib/admin-api";
import { useToast } from "../../components/AdminToast";
import { WHISH_QRS, emptyWhishConfig, readiness, type WhishConfig } from "@/lib/book-orders/whish-config";
const field = "mt-2 w-full rounded-xl border border-gray-700 bg-[#0f172a] px-3 py-2.5 text-sm text-white";
export default function BookWhishSettingsPage() {
  const toast = useToast();
  const [config, setConfig] = useState<WhishConfig>(emptyWhishConfig);
  const [version, setVersion] = useState<string | null>(null);
  const [savedReceiver, setSavedReceiver] = useState("|");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { adminGet<{ config: WhishConfig; version: string | null }>("/book-whish").then(r => { setConfig(r.config); setVersion(r.version); setSavedReceiver(r.config.accountName + "|" + r.config.accountNumber); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  const issues = readiness(config);
  const receiverDirty = savedReceiver !== config.accountName + "|" + config.accountNumber;
  function receiver(key: "accountName" | "accountNumber", value: string) {
    setConfig(c => ({ ...c, [key]: value, enabled: false, qrCodes: c.qrCodes.map(q => ({ ...q, verified: false })) }));
  }
  function qr(amount: number, patch: Partial<WhishConfig["qrCodes"][number]>) {
    setConfig(c => ({ ...c, enabled: false, qrCodes: c.qrCodes.map(q => q.amountCents === amount ? { ...q, ...patch } : q) }));
  }
  async function save() {
    setSaving(true); setError("");
    try { const result = await adminPut<{ config: WhishConfig; version: string }>("/book-whish", { ...config, version }); setConfig(result.config); setVersion(result.version); setSavedReceiver(result.config.accountName + "|" + result.config.accountNumber); toast.success(result.config.enabled ? "Whish enabled" : "Whish draft saved; checkout remains disabled"); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save setup."); }
    finally { setSaving(false); }
  }
  if (loading) return <p className="py-12 text-gray-400">Loading Whish setup…</p>;
  return <div className="max-w-6xl">
    <Link href="/admin/book-orders" className="text-sm text-gray-400 hover:text-white">← Book orders</Link>
    <h1 className="mt-5 text-3xl font-bold text-white">Whish payment setup</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">The five supplied QR images are imported unchanged. Amount labels come from their filenames; verify the recipient and USD amount in Whish before checking each slot. Saving a draft does not enable payments.</p>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
    <section className="mt-7 grid gap-5 rounded-2xl bg-[#1e293b] p-6 md:grid-cols-2">
      <label className="text-sm text-gray-300">Receiving account name<input value={config.accountName} onChange={e => receiver("accountName", e.target.value)} maxLength={120} className={field} /></label>
      <label className="text-sm text-gray-300">Receiving account phone number<input value={config.accountNumber} onChange={e => receiver("accountNumber", e.target.value)} maxLength={30} type="tel" className={field} /></label>
      <label className="text-sm text-gray-300">Support WhatsApp number (with country code)<input value={config.supportPhone} onChange={e => setConfig(c => ({ ...c, supportPhone: e.target.value }))} maxLength={30} type="tel" className={field} /></label>
      <label className="text-sm text-gray-300">Payment window (hours)<input value={config.holdHours} onChange={e => setConfig(c => ({ ...c, holdHours: Number(e.target.value) }))} type="number" min={1} max={168} className={field} /><span className="mt-2 block text-xs text-gray-500">Applies to new orders. Payments already awaiting review remain reserved.</span></label>
      {receiverDirty && <button type="button" onClick={save} disabled={saving} className="min-h-12 rounded-xl bg-brand-blue px-5 py-3 font-semibold text-white disabled:opacity-50 md:col-span-2">{saving ? "Saving…" : "Save receiving details before verifying QRs"}</button>}
      <p className="text-xs leading-5 text-gray-500 md:col-span-2">When changing the recipient, first save the receiving details with QR verification cleared, then verify all codes against that saved account.</p>
    </section>
    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {WHISH_QRS.map(asset => {
        const value = config.qrCodes.find(q => q.amountCents === asset.amountCents)!;
        return <section key={asset.amountCents} className="rounded-2xl bg-[#1e293b] p-5">
          <h2 className="text-xl font-bold text-white">USD {asset.amountCents / 100}</h2>
          <p className="mt-1 text-xs text-gray-400">{asset.amountCents === 500 ? "Single book: pickup / LEE distribution" : asset.amountCents === 900 ? "Single book: delivery included" : asset.amountCents === 2500 ? "5 books" : asset.amountCents === 5000 ? "10 + 1 free" : "20 + 2 free"}</p>
          <img src={asset.imageUrl} width={240} height={240} alt={"Original Whish QR labelled USD " + asset.amountCents / 100} className="mx-auto my-5 aspect-square w-full max-w-60 rounded-xl bg-white object-contain" />
          <a href={asset.paymentUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-blue underline underline-offset-4">Open the exact link encoded in this QR</a>
          <div className="mt-5 space-y-4 text-sm leading-5 text-gray-300">
            <label className="flex items-start gap-2"><input type="checkbox" checked={value.verified} disabled={receiverDirty || saving} onChange={e => qr(asset.amountCents, { verified: e.target.checked })} className="mt-1" />Recipient, amount and USD currency checked in Whish</label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={value.reusable} onChange={e => qr(asset.amountCents, { reusable: e.target.checked })} className="mt-1" />Repeat payments by different customers confirmed</label>
            <label className="block">Expiry, if any (UTC)<input type="datetime-local" value={value.expiresAt?.slice(0, 16) || ""} onChange={e => qr(asset.amountCents, { expiresAt: e.target.value ? new Date(e.target.value + ":00Z").toISOString() : null, expiryConfirmed: false })} className={field} /></label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={value.expiryConfirmed} onChange={e => qr(asset.amountCents, { expiryConfirmed: e.target.checked })} className="mt-1" />Expiry date verified, or Whish confirmed this code does not expire</label>
          </div>
        </section>;
      })}
    </div>
    <section className="mt-7 rounded-2xl bg-[#1e293b] p-6">
      <h2 className="font-bold text-white">{issues.length ? "Verification still needed" : "All setup checks completed"}</h2>
      {issues.length > 0 && <ul className="mt-3 list-disc space-y-1 ps-5 text-sm leading-6 text-amber-200">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
      <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-white"><input type="checkbox" checked={config.enabled} disabled={issues.length > 0 && !config.enabled} onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))} className="h-5 w-5" />Enable Whish in customer checkout</label>
      <p className="mt-2 text-xs leading-5 text-gray-400">Disabling stops new payment instructions. Existing customers can still report a payment they already sent, and staff can finish reviewing it.</p>
      <button type="button" disabled={saving} onClick={save} className="mt-5 min-h-12 rounded-xl bg-brand-blue px-6 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save payment setup"}</button>
    </section>
  </div>;
}
