"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ebookFetch, money, stateLabel } from "./client";
import { canVerifyEbookPayment } from "@/lib/ebooks/policy";
import s from "./ebooks.module.css";
type Order = {
  id: string;
  reference: string;
  title: string;
  customerName: string;
  priceCents: number;
  method: string;
  state: string;
  createdAt: string;
  reader: { email: string };
  access: { active: boolean } | null;
};
type Detail = Order & {
  updatedAt: string;
  customerNote: string;
  submittedReference: string | null;
  verifiedReference: string | null;
  hasReceipt: boolean;
  emails: { id: string; subject: string; sentAt: string | null; cancelled: boolean; attempts: number }[];
  events: {
    id: string;
    action: string;
    actor: string;
    details: { note?: string };
    createdAt: string;
  }[];
};
export function AdminEbookOrders({ readers = false }: { readers?: boolean }) {
  const [data, setData] = useState<{ orders: Order[]; total: number } | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setData(
        await ebookFetch(
          `/api/admin/ebook-orders?access=${readers ? 1 : 0}&page=${page}&search=${encodeURIComponent(search)}`,
        ),
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [page, readers, search]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <main className={`${s.shell} ${s.admin}`}>
      <div className={s.top}>
        <div>
          <span className={s.eyebrow}>Ebooks</span>
          <h1>{readers ? "Reader access" : "Ebook orders"}</h1>
          <p className={s.muted}>
            {readers
              ? "Manage reading access independently of payment status."
              : "Verify receipt of payment before granting online reading access."}
          </p>
        </div>
        <button className={s.secondary} onClick={() => void load()}>
          Refresh
        </button>
      </div>
      <form
        className={s.row}
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(query);
          setPage(1);
        }}
      >
        <input
          aria-label="Search orders"
          className={s.input}
          style={{ maxWidth: 400 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, customer or order reference"
        />
        <button className={s.secondary}>Search</button>
      </form>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {!data ? (
        <p className={s.loading}>Loading…</p>
      ) : (
        <>
          <div className={`${s.tableWrap} ${s.card} ${s.list}`}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Order / ebook</th>
                  <th>Reader</th>
                  <th>Payment</th>
                  <th>Reading access</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/ebook-orders/${o.id}`}>
                        {o.reference}
                      </Link>
                      <p>{o.title}</p>
                    </td>
                    <td>
                      {o.customerName}
                      <p className={s.muted}>{o.reader.email}</p>
                    </td>
                    <td>
                      {money(o.priceCents)} · {o.method}
                      <p>
                        <span className={s.badge}>{stateLabel(o.state)}</span>
                      </p>
                    </td>
                    <td>
                      {o.access
                        ? o.access.active
                          ? "Active"
                          : "Revoked"
                        : "Not granted"}
                    </td>
                    <td>
                      <Link className={s.secondary} href={`/admin/ebook-orders/${o.id}`}>
                        {canVerifyEbookPayment(o.state) ? "Validate payment" : "View order"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.orders.length && (
              <p className={s.empty}>
                No {readers ? "reader access records" : "ebook orders"} found.
              </p>
            )}
          </div>
          <div className={`${s.row} ${s.list}`}>
            <button
              className={s.secondary}
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} · {data.total} records
            </span>
            <button
              className={s.secondary}
              disabled={page * 30 >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}
export function AdminEbookOrder({ id }: { id: string }) {
  const [order, setOrder] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState("VERIFY");
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [checked, setChecked] = useState(false);
  const load = useCallback(async () => {
    const data = await ebookFetch<Detail>(`/api/admin/ebook-orders/${id}`);
    setOrder(data);
    setChecked(false);
    setAmount("");
    setReference(data.submittedReference || "");
    setAction(
      data.state === "VERIFIED"
        ? data.access?.active
          ? "RESEND"
          : "RESTORE"
        : "VERIFY",
    );
  }, [id]);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  async function submit() {
    if (!order) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await ebookFetch(`/api/admin/ebook-orders/${id}`, {
        action,
        expectedUpdatedAt: order.updatedAt,
        note,
        checkedWallet: checked,
        ...(action === "VERIFY"
          ? {
              transactionReference: reference,
              receivedAmountCents: Math.round(Number(amount) * 100),
              currency: "USD",
            }
          : {}),
      });
      await load();
      setNote("");
      setChecked(false);
      setMessage("Saved. The customer notification is queued for delivery.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={`${s.shell} ${s.admin}`}>
      <div className={s.top}>
        <div>
          <Link className={s.eyebrow} href="/admin/ebook-orders">
            Ebook orders
          </Link>
          <h1>{order?.reference || "Order review"}</h1>
        </div>
        <button
          className={s.secondary}
          onClick={() => void load().catch((e) => setError(e.message))}
        >
          Reload
        </button>
      </div>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className={s.notice} role="status">
          {message}
        </p>
      )}
      {order && (
        <>
          <div className={s.split}>
            <section className={s.card}>
              <h2>{order.title}</h2>
              <p>{order.customerName}</p>
              <p className={s.muted}>{order.reader.email}</p>
              <p className={s.price}>{money(order.priceCents)}</p>
              <p>{order.method}</p>
              <p className={s.notice}>
                Payment: {stateLabel(order.state)}
                <br />
                Reading access:{" "}
                {order.access
                  ? order.access.active
                    ? "Active"
                    : "Revoked"
                  : "Not granted"}
              </p>
              <p>Submitted reference: {order.submittedReference || "—"}</p>
              {order.verifiedReference && (
                <p>Verified reference: {order.verifiedReference}</p>
              )}
              {order.customerNote && (
                <p className={s.muted}>{order.customerNote}</p>
              )}
              {order.hasReceipt && (
                <a
                  href={`/api/admin/ebook-orders/${id}?receipt=1`}
                  target="_blank"
                  rel="noreferrer"
                  className={s.secondary}
                >
                  View private receipt
                </a>
              )}
            </section>
            <section className={s.card}>
              <h2>Review & access</h2>
              {!canVerifyEbookPayment(order.state) && order.state !== "VERIFIED" ? (
                <p className={s.muted}>
                  Cancelled and refunded orders cannot be validated or have access restored.
                </p>
              ) : (
                <form
                  className={s.form}
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                  }}
                >
                  {["AWAITING_PAYMENT", "CHANGES_REQUESTED"].includes(order.state) && (
                    <p className={s.notice}>
                      {order.state === "AWAITING_PAYMENT"
                        ? "The customer has not submitted payment details yet."
                        : "The customer has been asked to correct their payment details."}{" "}
                      If you have received the payment, enter the actual transaction
                      reference and exact amount from the receiving account below
                      to validate this order and grant reading access.
                    </p>
                  )}
                  <label>
                    Action
                    <select
                      value={action}
                      onChange={(e) => {
                        setAction(e.target.value);
                        setChecked(false);
                      }}
                    >
                      {canVerifyEbookPayment(order.state) ? (
                        <>
                          <option value="VERIFY">
                            Confirm payment & grant access
                          </option>
                          {order.state === "UNDER_REVIEW" && <option value="REQUEST_CORRECTION">
                            Request a correction
                          </option>}
                        </>
                      ) : (
                        <>
                          {order.access?.active ? (
                            <>
                              <option value="RESEND">
                                Resend reading invitation
                              </option>
                              <option value="REVOKE">
                                Revoke reading access
                              </option>
                            </>
                          ) : (
                            <option value="RESTORE">
                              Restore reading access
                            </option>
                          )}
                          <option value="REFUND">
                            Record completed refund & revoke access
                          </option>
                        </>
                      )}
                    </select>
                  </label>
                  {action === "VERIFY" && (
                    <>
                      <label>
                        Actual transaction reference
                        <input
                          required
                          minLength={3}
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                        />
                      </label>
                      <label>
                        Received amount (USD)
                        <input
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Enter amount received"
                        />
                      </label>
                    </>
                  )}
                  {action !== "RESEND" && (
                    <label>
                      {action === "REQUEST_CORRECTION"
                        ? "Message to the customer"
                        : "Reason / review note"}
                      <textarea
                        required={action !== "VERIFY"}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={1000}
                      />
                    </label>
                  )}
                  {["VERIFY", "REFUND"].includes(action) && (
                    <label className={s.check}>
                      <input
                        type="checkbox"
                        checked={checked}
                        required
                        onChange={(e) => setChecked(e.target.checked)}
                      />
                      {action === "REFUND"
                        ? "I completed the refund outside this website and recorded its reference above."
                        : "I checked the receiving account and confirmed the exact USD amount and reference."}
                    </label>
                  )}
                  <button disabled={busy} className={s.button}>
                    {busy ? "Saving…" : action === "VERIFY" ? "Confirm payment & grant access" : "Apply action"}
                  </button>
                </form>
              )}
            </section>
          </div>
          <section className={`${s.card} ${s.list}`}>
            <h2>Email delivery</h2>
            {order.emails.map((email) => <div className={s.version} key={email.id}><strong>{email.subject}</strong><p className={s.muted}>{email.sentAt ? "Sent to provider" : email.cancelled ? "Superseded by a newer update" : `Queued for retry · ${email.attempts} attempts`}</p></div>)}
            <h2>Activity</h2>
            {order.events.map((event) => (
              <div className={s.version} key={event.id}>
                <strong>{event.action.replaceAll("_", " ")}</strong>
                <p className={s.muted}>
                  {new Date(event.createdAt).toLocaleString()} · {event.actor}
                </p>
                {event.details.note && <p>{event.details.note}</p>}
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
