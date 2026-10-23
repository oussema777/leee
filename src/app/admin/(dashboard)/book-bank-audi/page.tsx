"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGet } from "@/lib/admin-api";
import { CardCheckoutTest } from "@/components/books/CardCheckoutTest";

type Setup = { customerTestEnabled?: boolean; configured: boolean; testCheckoutAvailable: boolean; testCheckoutMessage: string | null };
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
      <p className="mt-4 rounded-xl bg-[#0f172a] p-4 text-sm leading-6 text-gray-300">Real card payments are not enabled yet. The form below diagnoses a saved order without changing its payment status.</p>
    </section>
    {state?.customerTestEnabled && <section className="rounded-2xl border border-brand-blue/40 bg-[#1e293b] p-6 text-white">
      <h2 className="text-xl font-bold">Test the complete purchase flow</h2>
      <p className="mt-3 text-sm leading-6">Stay signed in as an administrator, create a new order and choose Bank Audi test card. A verified test payment confirms that test order automatically. Printed test orders do not reserve stock or ship; ebook test orders unlock reading for your reader account. Use test cards only.</p>
      <div className="mt-4 flex gap-5"><Link className="text-brand-blue-light underline" href="/en/books">Test printed books</Link><Link className="text-brand-blue-light underline" href="/en/ebooks">Test ebooks</Link></div>
    </section>}
    {state?.testCheckoutAvailable ? <CardCheckoutTest /> : state && <section className="rounded-2xl border border-gray-700 bg-[#1e293b] p-6">
      <h2 className="text-xl font-bold text-white">Card testing is not open here yet</h2>
      <p role="status" className="mt-3 text-sm leading-6 text-gray-300">{state.testCheckoutMessage}</p>
    </section>}
    <p className="text-sm leading-6 text-gray-400">Existing bank-transfer records remain in order history. Diagnostic tests below leave real orders unchanged. Only dedicated customer test orders can be confirmed or grant test reading access.</p>
  </div>;
}
