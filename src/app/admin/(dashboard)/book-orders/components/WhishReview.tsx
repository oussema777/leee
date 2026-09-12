"use client";
import { useState } from "react";
import { adminPost } from "@/lib/admin-api";
import type { AdminWhishPayment } from "@/lib/book-orders/payment-types";
const field = "mt-2 w-full rounded-xl border border-gray-700 bg-[#0f172a] px-3 py-2.5 text-sm text-white";
export function WhishReview({ orderId, amountCents, orderStatus, payment, onReviewed }: {
  orderId: string; amountCents: number; orderStatus: string; payment: AdminWhishPayment; onReviewed: () => Promise<void>;
}) {
  const [reference, setReference] = useState(payment.submittedReference || payment.verifiedReference || "");
  const [amount, setAmount] = useState(""); const [note, setNote] = useState("");
  const [checked, setChecked] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function review(action: "VERIFY" | "REQUEST_CORRECTION" | "REFUND") {
    setBusy(true); setError("");
    try {
      await adminPost("/book-orders/" + orderId + "/whish", {
        action, expectedUpdatedAt: payment.updatedAt, transactionReference: reference,
        ...(amount ? { receivedAmountCents: Math.round(Number(amount) * 100) } : {}),
        currency: "USD", checkedWallet: checked, note,
      });
      setChecked(false); setNote(""); await onReviewed();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not review payment."); }
    finally { setBusy(false); }
  }
  const human = (s: string) => s.toLowerCase().replaceAll("_", " ");
  return <section className="rounded-xl border border-brand-blue/30 bg-[#1e293b] p-6">
    <h2 className="text-lg font-bold text-white">Whish payment · {human(payment.state)}</h2>
    {orderStatus === "CANCELLED" && <p className="mt-4 rounded-xl bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">This order is closed and its reservation has been released. Recording receipt does not reopen it. Contact the purchaser to arrange available stock or a refund.</p>}
    <dl className="mt-5 grid gap-5 sm:grid-cols-2">
      {[["Expected total", "USD " + amountCents / 100], ["Receiving account", payment.snapshot.accountName + " · " + payment.snapshot.accountNumber], ["Customer's Whish reference", payment.submittedReference], ["Sender phone", payment.senderPhone], ["Submitted", payment.submittedAt ? new Date(payment.submittedAt).toLocaleString() : null], ["Payment deadline", new Date(payment.expiresAt).toLocaleString()], ["Confirmed wallet reference", payment.verifiedReference]].map(([label, value]) => <div key={label}><dt className="text-xs text-gray-400">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-white">{value || "—"}</dd></div>)}
    </dl>
    {payment.events.filter(event => event.action === "SUBMITTED" && typeof event.details.receiptPath === "string").map(event => <details key={event.id} className="mt-5 rounded-xl bg-[#0f172a] p-4"><summary className="cursor-pointer text-sm font-semibold text-brand-blue-light">Payment screenshot · {new Date(event.createdAt).toLocaleString()}</summary><p className="mt-3 text-xs leading-5 text-gray-400">Supporting evidence only. Confirm the actual incoming transaction in the receiving wallet.</p><a href={"/api/admin/book-orders/" + encodeURIComponent(orderId) + "/whish/receipt?event=" + encodeURIComponent(event.id)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-white underline">Open screenshot</a></details>)}
    {payment.customerNote && <p className="mt-5 whitespace-pre-wrap rounded-xl bg-[#0f172a] p-4 text-sm text-amber-200">Customer message: {payment.customerNote}</p>}
    {["UNDER_REVIEW", "VERIFIED"].includes(payment.state) && <div className="mt-6 space-y-4 border-t border-gray-700 pt-5">
      {payment.state === "UNDER_REVIEW" && <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-300">Actual receiving-wallet reference<input value={reference} onChange={e => setReference(e.target.value)} maxLength={100} className={field} /></label>
        <label className="text-sm text-gray-300">Actual amount received (USD)<input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={field} /></label>
      </div>}
      <label className="block text-sm text-gray-300">Message for the customer / refund reference<textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={500} className={field} /></label>
      <label className="flex items-start gap-3 text-sm leading-6 text-gray-300"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="mt-1 h-4 w-4" />{payment.state === "VERIFIED" ? "I completed the refund outside the website and recorded its reference above." : "I checked the actual incoming transaction, sender, reference, exact amount and USD currency in LEE's receiving wallet."}</label>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {payment.state === "UNDER_REVIEW" ? <><button type="button" disabled={busy || !checked || !amount || !reference} onClick={() => review("VERIFY")} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Confirm payment received</button><button type="button" disabled={busy || !note.trim()} onClick={() => review("REQUEST_CORRECTION")} className="rounded-xl border border-amber-400/50 px-5 py-3 text-sm font-bold text-amber-200 disabled:opacity-50">Request correction</button></> : <button type="button" disabled={busy || !checked || !note.trim()} onClick={() => review("REFUND")} className="rounded-xl border border-amber-400/50 px-5 py-3 text-sm font-bold text-amber-200 disabled:opacity-50">Record completed refund</button>}
      </div>
    </div>}
    <details className="mt-6 border-t border-gray-700 pt-4"><summary className="cursor-pointer text-sm font-semibold text-gray-300">Payment history ({payment.events.length})</summary><ol className="mt-4 space-y-3">{payment.events.map(event => <li key={event.id} className="rounded-xl bg-[#0f172a] p-4 text-xs leading-5 text-gray-400"><strong className="text-white">{human(event.action)}</strong> · {new Date(event.createdAt).toLocaleString()}<p>Actor: {event.actor}</p>{typeof event.details.note === "string" && <p className="whitespace-pre-wrap">{event.details.note}</p>}{typeof event.details.reference === "string" && <p>Reference: {event.details.reference}</p>}</li>)}</ol></details>
  </section>;
}
