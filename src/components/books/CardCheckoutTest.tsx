"use client";
import { useEffect, useRef, useState } from "react";
import { adminPost } from "@/lib/admin-api";

type Session = { sessionJwt: string; clientLibrary: string; clientLibraryIntegrity: string; expiresAt: string };
type Attempt = { id: string; reference: string; state: string; amountCents: number; expiresAt: string | null; transactionId: string | null };
type Order = { reference: string; amountCents: number; attempt: Attempt | null };
type Checkout = { mount: (options: { paymentSelection: string; paymentScreen: string }) => Promise<unknown>; destroy: () => void };
type Client = { createCheckout: (options: { autoProcessing: boolean }) => Promise<Checkout>; destroy: () => void };
declare global { interface Window { VAS?: { UnifiedCheckout: (jwt: string) => Promise<Client> } } }
const inputClass = "mt-2 w-full rounded-xl border border-gray-600 bg-[#0f172a] px-4 py-3 text-white";
const buttonClass = "rounded-xl bg-brand-blue px-5 py-3 font-semibold text-white disabled:opacity-50";
const messages: Record<string, string> = {
  TEST_AUTHORIZED: "Test authorization verified. The amount is authorized, but a capture has not been confirmed.",
  TEST_CAPTURED: "Test capture verified with Cybersource. This does not represent real money or mark this order paid.",
  TEST_DECLINED: "Cybersource confirmed that the test payment was declined. You can start another test.",
  REVIEW_REQUIRED: "The transaction needs review. Do not pay again. Check its status with Cybersource.",
  CREATING: "A checkout session is being prepared. Refresh the saved status before trying again.",
  SESSION_FAILED: "The card form could not be prepared. No form was opened for this attempt. You can try again.",
  READY: "A test checkout was started. Resume it while it is valid, or check its transaction before starting another.",
};
function transactionHint(result: unknown): string | null {
  // The browser result is only a lookup hint. Server-side transaction details decide outcome.
  try {
    if (typeof result !== "string" || result.length > 256 * 1024) return null;
    const part = result.split(".")[1]; if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    return typeof decoded.id === "string" && /^\d{10,30}$/.test(decoded.id) ? decoded.id : null;
  } catch { return null; }
}
export function CardCheckoutTest() {
  const [kind, setKind] = useState<"BOOK" | "EBOOK">("BOOK"); const [reference, setReference] = useState("");
  const [order, setOrder] = useState<Order | null>(null); const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [confirmed, setConfirmed] = useState(false); const [busy, setBusy] = useState(false); const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(""); const [transactionId, setTransactionId] = useState("");
  const running = useRef(false), alive = useRef(true), checkoutRef = useRef<Checkout | null>(null), clientRef = useRef<Client | null>(null);
  function dispose() { try { checkoutRef.current?.destroy(); } catch {} try { clientRef.current?.destroy(); } catch {} checkoutRef.current = null; clientRef.current = null; }
  useEffect(() => { alive.current = true; return () => { alive.current = false; dispose(); }; }, []);
  const selection = { kind, reference: reference.trim() };
  async function inspect() {
    if (running.current) return; running.current = true; setBusy(true); setError("");
    try { const value = await adminPost<Order>("/book-bank-audi/checkout", { action: "inspect", selection }); if (alive.current) { setOrder(value); setAttempt(value.attempt); setTransactionId(value.attempt?.transactionId ?? ""); setConfirmed(false); } }
    catch (e) { if (alive.current) setError(e instanceof Error ? e.message : "Could not load this order."); }
    finally { running.current = false; if (alive.current) setBusy(false); }
  }
  async function verify(id: string, transaction: string) {
    const result = await adminPost<{ attempt: Attempt }>("/book-bank-audi/checkout", { action: "result", attemptId: id, transactionId: transaction });
    if (alive.current) setAttempt(result.attempt);
  }
  async function open(retry = false) {
    if (running.current || !confirmed) return; running.current = true; setBusy(true); setError("");
    try {
      const result = await adminPost<{ attempt: Attempt; session: Session | null }>("/book-bank-audi/checkout", { action: "start", selection, confirmedTest: true, retry });
      if (!alive.current) return; setAttempt(result.attempt);
      if (!result.session) return;
      const session = result.session;
      dispose();
      const url = new URL(session.clientLibrary);
      if (url.origin !== "https://testup.cybersource.com" || !url.pathname.startsWith("/uc/") || !session.clientLibraryIntegrity) throw Error("Unexpected checkout library. Contact support.");
      await new Promise<void>((resolve, reject) => {
        const existing = document.getElementById("audi-checkout-sdk") as HTMLScriptElement | null;
        if (existing?.src === session.clientLibrary && existing.integrity === session.clientLibraryIntegrity && window.VAS) return resolve();
        existing?.remove(); const script = document.createElement("script"); script.id = "audi-checkout-sdk";
        script.src = session.clientLibrary; script.integrity = session.clientLibraryIntegrity; script.crossOrigin = "anonymous";
        const timeout = setTimeout(() => { script.remove(); reject(Error("Card form loading timed out. Refresh the saved test status.")); }, 20000);
        script.onload = () => { clearTimeout(timeout); resolve(); }; script.onerror = () => { clearTimeout(timeout); reject(Error("Could not load the secure card form.")); }; document.head.appendChild(script);
      });
      if (!alive.current) return;
      if (!window.VAS) throw Error("Secure checkout is unavailable.");
      clientRef.current = await window.VAS.UnifiedCheckout(session.sessionJwt);
      if (!alive.current) { dispose(); return; }
      checkoutRef.current = await clientRef.current.createCheckout({ autoProcessing: true });
      if (!alive.current) { dispose(); return; }
      setMounted(true);
      const completion = await checkoutRef.current.mount({ paymentSelection: "#audi-payment-options", paymentScreen: "#audi-payment-screen" });
      if (!alive.current) return;
      const transaction = transactionHint(completion);
      if (!transaction) throw Error("The form closed without a transaction reference. Do not pay again; check Cybersource and use Check transaction below.");
      setTransactionId(transaction); await verify(result.attempt.id, transaction);
    } catch { if (alive.current) setError("Checkout could not be verified. Do not pay again. Reload the saved status, or check the transaction ID from Cybersource below."); }
    finally { dispose(); running.current = false; if (alive.current) { setBusy(false); setMounted(false); } }
  }
  async function recheck() {
    if (!attempt || running.current) return; running.current = true; setBusy(true); setError("");
    try { await verify(attempt.id, transactionId.trim()); } catch { setError("Could not verify this transaction. It may not be available yet, or may belong to another test. Do not pay again."); }
    finally { running.current = false; if (alive.current) setBusy(false); }
  }
  return <section className="rounded-2xl border border-gray-700 bg-[#1e293b] p-6 text-gray-200">
    <h2 className="text-xl font-bold text-white">Test the card checkout</h2>
    <p className="mt-3 rounded-xl bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">Test cards only. This test uses the saved order amount. It does not collect real money, mark an order paid, reserve more stock or unlock an ebook.</p>
    <fieldset disabled={busy || mounted} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label>Order type<select className={inputClass} value={kind} onChange={e => { setKind(e.target.value as "BOOK" | "EBOOK"); setOrder(null); setAttempt(null); }}><option value="BOOK">Printed books</option><option value="EBOOK">Ebook</option></select></label>
      <label>Order reference <span className="text-red-400" aria-hidden="true">*</span><input required className={inputClass} value={reference} maxLength={80} onChange={e => { setReference(e.target.value); setOrder(null); setAttempt(null); }} placeholder="Copy the reference from Book Orders" /></label>
    </fieldset>
    <button type="button" className={buttonClass + " mt-4"} disabled={busy || !reference.trim()} onClick={() => void inspect()}>{busy && !mounted ? "Please wait…" : "Load saved order"}</button>
    {order && <div className="mt-6 space-y-4 border-t border-gray-700 pt-5">
      <p className="font-semibold text-white">{order.reference} · USD {((attempt?.amountCents ?? order.amountCents) / 100).toFixed(2)}</p>
      {attempt && <p role="status" className="rounded-xl bg-[#0f172a] p-4 text-sm leading-6">{messages[attempt.state] || "The test status needs review."}{attempt.transactionId && <span className="mt-2 block break-all">Transaction: {attempt.transactionId}</span>}</p>}
      {(!attempt || ["READY", "SESSION_FAILED", "TEST_DECLINED"].includes(attempt.state)) && <><label className="flex gap-3 text-sm leading-6"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />I will use a test card and understand this will not pay the real order. <span className="text-red-400" aria-hidden="true">*</span></label><button type="button" className={buttonClass} disabled={busy || !confirmed || !!(attempt?.expiresAt && Date.parse(attempt.expiresAt) <= Date.now() && attempt.state === "READY")} onClick={() => void open(!!attempt && ["SESSION_FAILED", "TEST_DECLINED"].includes(attempt.state))}>{mounted ? "Card form open…" : attempt?.state === "READY" ? "Resume test checkout" : "Open test card checkout"}</button></>}
      <div id="audi-payment-options" /><div id="audi-payment-screen" className="overflow-hidden rounded-xl" />
      {attempt && !["TEST_CAPTURED", "TEST_AUTHORIZED", "TEST_DECLINED"].includes(attempt.state) && <div className="border-t border-gray-700 pt-4"><label className="text-sm">Transaction ID from Cybersource<input className={inputClass} value={transactionId} disabled={busy} onChange={e => setTransactionId(e.target.value)} maxLength={30} inputMode="numeric" /></label><button type="button" className={buttonClass + " mt-3"} disabled={busy || !/^\d{10,30}$/.test(transactionId.trim())} onClick={() => void recheck()}>Check transaction</button><p className="mt-2 text-xs leading-5 text-gray-400">Use this after an interrupted checkout. The server checks the reference and amount; entering an ID cannot mark an order paid.</p></div>}
    </div>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm leading-6 text-red-200">{error}</p>}
  </section>;
}
