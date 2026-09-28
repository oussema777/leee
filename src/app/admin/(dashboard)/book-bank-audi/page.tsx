"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGet, adminPut } from "@/lib/admin-api";
import { bankAudiReadiness, emptyBankAudiConfig, type BankAudiConfig } from "@/lib/book-orders/bank-audi-config";
import { useToast } from "../../components/AdminToast";

const field = "mt-2 w-full rounded-xl border border-gray-700 bg-[#0f172a] px-3 py-2.5 text-sm text-white";
const identity = (c: BankAudiConfig) => [c.accountName, c.accountNumber, c.iban, c.qrImageUrl].join("|");
export default function BookBankAudiPage() {
  const toast = useToast();
  const [config, setConfig] = useState<BankAudiConfig>(emptyBankAudiConfig);
  const [version, setVersion] = useState<string | null>(null);
  const [savedIdentity, setSavedIdentity] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { adminGet<{ config: BankAudiConfig; version: string | null }>("/book-bank-audi")
    .then(result => { setConfig(result.config); setVersion(result.version); setSavedIdentity(identity(result.config)); })
    .catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  function changeBankDetails(patch: Partial<BankAudiConfig>) {
    setConfig(current => ({ ...current, ...patch, enabled: false, qrVerified: false, termsVerified: false }));
  }
  async function save() {
    setSaving(true); setError("");
    try {
      const result = await adminPut<{ config: BankAudiConfig; version: string }>("/book-bank-audi", { ...config, version });
      setConfig(result.config); setVersion(result.version); setSavedIdentity(identity(result.config));
      toast.success(result.config.enabled ? "Bank Audi enabled" : "Bank Audi draft saved; checkout remains disabled");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save Bank Audi setup."); }
    finally { setSaving(false); }
  }
  const issues = bankAudiReadiness(config);
  const identityDirty = identity(config) !== savedIdentity;
  if (loading) return <p className="py-12 text-gray-400">Loading Bank Audi setup…</p>;
  return <div className="max-w-4xl">
    <Link href="/admin/book-orders" className="text-sm text-gray-400 hover:text-white">← Book orders</Link>
    <h1 className="mt-5 text-3xl font-bold text-white">Bank Audi transfer setup</h1>
    <p className="mt-3 text-sm leading-6 text-gray-400">Verify the receiving account with its owner before enabling this method. Customers enter the amount and order reference in their banking app; staff confirm receipt before fulfilment.</p>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
    <section className="mt-7 grid gap-5 rounded-2xl bg-[#1e293b] p-6 md:grid-cols-2">
      <label className="text-sm text-gray-300">Exact beneficiary name<input value={config.accountName} onChange={e => changeBankDetails({ accountName: e.target.value })} maxLength={120} className={field} /></label>
      <label className="text-sm text-gray-300">Account number<input value={config.accountNumber} onChange={e => changeBankDetails({ accountNumber: e.target.value })} maxLength={30} dir="ltr" className={field} /></label>
      <label className="text-sm text-gray-300">Lebanese IBAN<input value={config.iban} onChange={e => changeBankDetails({ iban: e.target.value })} maxLength={34} dir="ltr" className={field} /></label>
      <label className="text-sm text-gray-300">Support WhatsApp number<input value={config.supportPhone} onChange={e => setConfig(c => ({ ...c, supportPhone: e.target.value }))} maxLength={30} dir="ltr" className={field} /></label>
      <label className="text-sm text-gray-300">Payment window (hours)<input type="number" min={1} max={168} value={config.holdHours} onChange={e => setConfig(c => ({ ...c, holdHours: Number(e.target.value) }))} className={field} /></label>
      <label className="text-sm text-gray-300">Versioned QR image path<input value={config.qrImageUrl} onChange={e => changeBankDetails({ qrImageUrl: e.target.value })} className={field} /></label>
    </section>
    <section className="mt-6 rounded-2xl bg-[#1e293b] p-6">
      <h2 className="text-xl font-bold text-white">Supplied Bank Audi QR</h2>
      {config.qrImageUrl && <img src={config.qrImageUrl} width={320} height={320} alt="Bank Audi account QR" className="mt-5 aspect-square w-full max-w-80 rounded-xl bg-white object-contain" />}
      <p className="mt-4 text-sm leading-6 text-gray-400">This QR contains account details only. It does not specify the amount or confirm that a transfer succeeded. Test it in the actual banking apps customers use.</p>
      <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-gray-300"><input type="checkbox" checked={config.qrVerified} disabled={identityDirty || saving} onChange={e => setConfig(c => ({ ...c, enabled: false, qrVerified: e.target.checked }))} className="mt-1 h-5 w-5" />I confirmed the saved QR, beneficiary name, IBAN and account number against the account owner&apos;s bank records, and tested scanning.</label>
      <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-gray-300"><input type="checkbox" checked={config.termsVerified} disabled={identityDirty || saving} onChange={e => setConfig(c => ({ ...c, enabled: false, termsVerified: e.target.checked }))} className="mt-1 h-5 w-5" />I confirmed this account accepts the intended USD transfers and understand incoming fees, minimums and settlement time.</label>
      {identityDirty && <p className="mt-3 text-xs text-amber-200">Save the bank details first, then verify the saved QR and transfer terms.</p>}
    </section>
    <section className="mt-6 rounded-2xl bg-[#1e293b] p-6">
      <h2 className="font-bold text-white">{issues.length ? "Setup still needed" : "Ready for controlled activation"}</h2>
      {issues.length > 0 && <ul className="mt-3 list-disc space-y-1 ps-5 text-sm text-amber-200">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
      <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-white"><input type="checkbox" checked={config.enabled} disabled={issues.length > 0} onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))} className="h-5 w-5" />Enable Bank Audi in checkout</label>
      <button type="button" disabled={saving} onClick={save} className="mt-5 min-h-12 rounded-xl bg-brand-blue px-6 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save Bank Audi setup"}</button>
    </section>
  </div>;
}
