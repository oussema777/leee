"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGet } from "@/lib/admin-api";
import { CardCheckoutTest } from "@/components/books/CardCheckoutTest";

type Setup = { configured: boolean; testCheckoutAvailable: boolean; testCheckoutMessage: string | null };
export default function BankAudiPage() {
  const [state, setState] = useState<Setup | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; adminGet<Setup>("/book-bank-audi")
    .then(value => { if (active) setState(value); }).catch(() => { if (active) setError("Could not load payment setup. Reload this page to try again."); });
    return () => { active = false; }; }, []);
  return <div className="mx-auto max-w-3xl space-y-6">
    <Link href="/admin/book-orders" className="text-sm text-brand-blue-light">Back to book orders</Link>
    <h1 className="text-3xl font-bold text-white">Bank Audi card payments</h1>
    <section className="rounded-2xl border border-gray-700 bg-[#1e293b] p-6">
      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-200">Test setup</span>
      <h2 className="mt-5 text-xl font-semibold text-white">Online checkout through Areeba / Cybersource</h2>
      <p className="mt-3 leading-7 text-gray-300">Customers will pay by card at checkout. Bank transfers, QR instructions and receipt uploads are no longer offered for Bank Audi.</p>
      {error ? <p role="alert" className="mt-5 text-red-300">{error}</p> : <p role="status" className="mt-5 text-gray-300">{!state ? "Checking setup…" : state.configured ? "Test credentials are configured on this server." : "Test credentials still need to be configured on this server."}</p>}
      <p className="mt-4 rounded-xl bg-[#0f172a] p-4 text-sm leading-6 text-gray-300">Customer card checkout is not enabled yet. Payment verification and checkout testing must be completed before activation.</p>
    </section>
    {state?.testCheckoutAvailable ? <CardCheckoutTest /> : state && <section className="rounded-2xl border border-gray-700 bg-[#1e293b] p-6">
      <h2 className="text-xl font-bold text-white">Card testing is not open here yet</h2>
      <p role="status" className="mt-3 text-sm leading-6 text-gray-300">{state.testCheckoutMessage}</p>
    </section>}
    <p className="text-sm leading-6 text-gray-400">Existing bank-transfer records remain in order history. Test payments must not mark real orders paid or unlock ebooks.</p>
  </div>;
}
