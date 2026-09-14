"use client";
import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import { adminGet, adminPut } from "@/lib/admin-api";
import { useToast } from "../../components/AdminToast";
import { emptyWhishConfig, readiness, type WhishConfig } from "@/lib/book-orders/whish-config";

const field = "mt-2 w-full rounded-xl border border-gray-700 bg-[#0f172a] px-3 py-2.5 text-sm text-white";

export default function BookWhishSettingsPage() {
  const toast = useToast();
  const [config, setConfig] = useState<WhishConfig>(emptyWhishConfig);
  const [version, setVersion] = useState<string | null>(null);
  const [savedIdentity, setSavedIdentity] = useState("||");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); const [error, setError] = useState("");
  useEffect(() => { adminGet<{ config: WhishConfig; version: string | null }>("/book-whish").then(r => {
    setConfig(r.config); setVersion(r.version); setSavedIdentity(r.config.accountName + "|" + r.config.accountNumber + "|" + r.config.qrImageUrl);
  }).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  const issues = readiness(config);
  const identityDirty = savedIdentity !== config.accountName + "|" + config.accountNumber + "|" + config.qrImageUrl;
  function identity(patch: Partial<Pick<WhishConfig, "accountName" | "accountNumber" | "qrImageUrl">>) {
    setConfig(c => ({ ...c, ...patch, enabled: false, qrVerified: false }));
  }
  async function uploadQr(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    setUploading(true); setError("");
    try {
      const body = new FormData(); body.set("file", file);
      const response = await fetch("/api/admin/book-whish/qr", { method: "POST", credentials: "include", body });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Could not upload the QR image.");
      identity({ qrImageUrl: result.url });
      toast.success("QR uploaded. Save and verify it before enabling Whish.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not upload the QR image."); }
    finally { setUploading(false); }
  }
  async function save() {
    setSaving(true); setError("");
    try {
      const result = await adminPut<{ config: WhishConfig; version: string }>("/book-whish", { ...config, version });
      setConfig(result.config); setVersion(result.version);
      setSavedIdentity(result.config.accountName + "|" + result.config.accountNumber + "|" + result.config.qrImageUrl);
      toast.success(result.config.enabled ? "Whish enabled" : "Whish draft saved; checkout remains disabled");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save setup."); }
    finally { setSaving(false); }
  }
  if (loading) return <p className="py-12 text-gray-400">Loading Whish setup…</p>;
  return <div className="max-w-4xl">
    <Link href="/admin/book-orders" className="text-sm text-gray-400 hover:text-white">← Book orders</Link>
    <h1 className="mt-5 text-3xl font-bold text-white">Whish payment setup</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">Upload one permanent QR for every Book Restore order. Customers will scan it and manually enter the exact order total shown on their payment page.</p>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
    <section className="mt-7 grid gap-5 rounded-2xl bg-[#1e293b] p-6 md:grid-cols-2">
      <label className="text-sm text-gray-300">Receiving account name<input value={config.accountName} onChange={e => identity({ accountName: e.target.value })} maxLength={120} className={field} /></label>
      <label className="text-sm text-gray-300">Receiving account phone number<input value={config.accountNumber} onChange={e => identity({ accountNumber: e.target.value })} maxLength={30} type="tel" className={field} /></label>
      <label className="text-sm text-gray-300">Support WhatsApp number (with country code)<input value={config.supportPhone} onChange={e => setConfig(c => ({ ...c, supportPhone: e.target.value }))} maxLength={30} type="tel" className={field} /></label>
      <label className="text-sm text-gray-300">Payment window (hours)<input value={config.holdHours} onChange={e => setConfig(c => ({ ...c, holdHours: Number(e.target.value) }))} type="number" min={1} max={168} className={field} /></label>
    </section>
    <section className="mt-6 rounded-2xl bg-[#1e293b] p-6">
      <h2 className="text-xl font-bold text-white">Permanent payment QR</h2>
      <p className="mt-2 text-sm leading-6 text-gray-400">PNG, JPG or WebP, maximum 2 MB. The server cleans and converts the upload before publishing it.</p>
      {config.qrImageUrl && <img src={config.qrImageUrl} width={320} height={320} alt="Uploaded permanent Whish QR" className="mt-5 aspect-square w-full max-w-80 rounded-xl bg-white object-contain" />}
      <label className="mt-5 inline-flex min-h-12 cursor-pointer items-center rounded-xl bg-brand-blue px-5 py-3 text-sm font-semibold text-white">
        {uploading ? "Uploading…" : config.qrImageUrl ? "Replace QR image" : "Upload QR image"}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || saving} onChange={uploadQr} className="sr-only" />
      </label>
      <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-gray-300"><input type="checkbox" checked={config.qrVerified} disabled={!config.qrImageUrl || identityDirty || saving || uploading} onChange={e => setConfig(c => ({ ...c, enabled: false, qrVerified: e.target.checked }))} className="mt-1 h-5 w-5" />I scanned the saved QR in Whish and confirmed the correct recipient, USD currency, reusable/non-expiring behavior, and that the customer can enter the amount.</label>
      {identityDirty && <p className="mt-3 text-xs text-amber-200">Save the receiving details and QR first. Then scan the saved image and verify it.</p>}
    </section>
    <section className="mt-7 rounded-2xl bg-[#1e293b] p-6">
      <h2 className="font-bold text-white">{issues.length ? "Setup still needed" : "All setup checks completed"}</h2>
      {issues.length > 0 && <ul className="mt-3 list-disc space-y-1 ps-5 text-sm leading-6 text-amber-200">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
      <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-white"><input type="checkbox" checked={config.enabled} disabled={issues.length > 0 && !config.enabled} onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))} className="h-5 w-5" />Enable Whish in customer checkout</label>
      <p className="mt-2 text-xs leading-5 text-gray-400">Until enabled, customers cannot start new Whish payments. Existing reports remain available to staff.</p>
      <button type="button" disabled={saving || uploading} onClick={save} className="mt-5 min-h-12 rounded-xl bg-brand-blue px-6 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save payment setup"}</button>
    </section>
  </div>;
}
