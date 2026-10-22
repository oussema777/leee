"use client";
import { LebanonCityInput } from "@/components/books/LebanonCityInput";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, PackagePlus, Trash2 } from "lucide-react";
import type { PreparationContext, PreparationInput, ShipmentPreparation } from "@/lib/aramex/preparation";
import { ShipmentStatus } from "../../components/ShipmentStatus";
import { ShipmentRecovery } from "../../components/ShipmentRecovery";
import { ShipmentTracking } from "../../components/ShipmentTracking";
import { ShipmentSend } from "../../components/ShipmentSend";
import { ShipmentLabel } from "../../components/ShipmentLabel";

type Parcel = { weightKg: string; lengthCm: string; widthCm: string; heightCm: string };
const emptyParcel = (): Parcel => ({ weightKg: "", lengthCm: "", widthCm: "", heightCm: "" });
const hasDimensions = (parcel: Parcel) => [parcel.lengthCm, parcel.widthCm, parcel.heightCm].some(value => value.trim() !== "");
const optionalNumber = (value: string) => value.trim() === "" ? undefined : Number(value);
const field = "mt-2 min-h-11 w-full rounded-lg border border-gray-600 bg-[#0f172a] px-3 py-2.5 text-base sm:text-sm text-white focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/60";
const fieldIds: Record<string, string> = { recipientName: "shipping-name", recipientPhone: "shipping-phone", recipientEmail: "shipping-email", city: "shipping-city", addressLine1: "shipping-addressLine1", addressLine2: "shipping-addressLine2", addressLine3: "shipping-addressLine3", parcels: "packed-parcels" };
const fieldNames: Record<string, string> = { recipientName: "Recipient name", recipientPhone: "Lebanese phone", recipientEmail: "Recipient email", city: "Delivery city", addressLine1: "Address line 1", addressLine2: "Address line 2", addressLine3: "Address line 3", parcels: "Packed parcels" };
function issueTarget(key: string) {
  const parcel = /^parcels\.(\d+)\.(weightKg|lengthCm|widthCm|heightCm)$/.exec(key);
  return parcel ? `parcel-${parcel[1]}-${parcel[2]}` : fieldIds[key];
}
function issueName(key: string) {
  const parcel = /^parcels\.(\d+)\.(weightKg|lengthCm|widthCm|heightCm)$/.exec(key);
  const names: Record<string, string> = { weightKg: "weight", lengthCm: "length", widthCm: "width", heightCm: "height" };
  return parcel ? `Parcel ${Number(parcel[1]) + 1} ${names[parcel[2]]}` : fieldNames[key] || "Shipping details";
}
const RequiredMark = () => <span aria-hidden="true" className="text-red-400"> *</span>;
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ");

export default function ShippingPreparationPage() {
  const { id } = useParams<{ id: string }>();
  const [context, setContext] = useState<PreparationContext | null>(null);
  const [values, setValues] = useState<PreparationContext["defaults"] | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([emptyParcel()]);
  const [draft, setDraft] = useState<ShipmentPreparation | null>(null);
  const [issues, setIssues] = useState<{ field: string; message: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [reload, setReload] = useState(0);
  const result = useRef<HTMLElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setDraft(null); setIssues([]); setContext(null); setValues(null);
    setDirty(false); setSavedNotice("");
    setParcels([emptyParcel()]);
    fetch(`/api/admin/book-orders/${encodeURIComponent(id)}/shipping`, {
      credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "Unable to load preparation.");
      if (!controller.signal.aborted) {
        const data = body as PreparationContext;
        setContext(data);
        const saved = data.savedDraft?.input;
        setValues(saved ? { ...saved, expectedUpdatedAt: data.defaults.expectedUpdatedAt } : data.defaults);
        if (saved) setParcels(saved.parcels.map(parcel => ({
          weightKg: String(parcel.weightKg), lengthCm: parcel.lengthCm === undefined ? "" : String(parcel.lengthCm),
          widthCm: parcel.widthCm === undefined ? "" : String(parcel.widthCm), heightCm: parcel.heightCm === undefined ? "" : String(parcel.heightCm),
        })));
      }
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load preparation.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, reload]);

  useEffect(() => {
    if (!dirty && !busy && !saving && !sending) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    // Capture sidebar and other in-app links before Next handles navigation.
    const guardLink = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const target = new URL(link.href, window.location.href);
      if (target.pathname === window.location.pathname && target.search === window.location.search) return;
      if (busy || saving || sending || !window.confirm("Leave without saving your shipping changes?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardLink, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guardLink, true);
    };
  }, [dirty, busy, saving, sending]);

  useEffect(() => { if (error) errorSummary.current?.focus(); }, [error]);
  // Focus after React has committed the review, not before its ref exists.
  useEffect(() => { if (draft) result.current?.focus(); }, [draft]);

  function invalid(key: string) {
    return issues.some(issue => issue.field === key)
      ? { "aria-invalid": true as const, "aria-describedby": "shipping-errors" } : {};
  }

  function edited() {
    setDirty(true); setSavedNotice(""); setDraft(null); setIssues([]); setError("");
  }
  function change(key: keyof PreparationContext["defaults"], value: string) {
    setValues(current => current ? { ...current, [key]: value } : current);
    edited();
  }
  function changeParcel(index: number, key: keyof Parcel, value: string) {
    setParcels(current => current.map((parcel, i) => i === index ? { ...parcel, [key]: value } : parcel));
    edited();
  }
  function currentInput(): PreparationInput {
    return {
      ...values!,
      parcels: parcels.map(parcel => ({
        weightKg: Number(parcel.weightKg), lengthCm: optionalNumber(parcel.lengthCm),
        widthCm: optionalNumber(parcel.widthCm), heightCm: optionalNumber(parcel.heightCm),
      })),
    };
  }
  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values || busy) return;
    setBusy(true); setDraft(null); setIssues([]); setError(""); setSavedNotice("");
    const body = currentInput();
    try {
      const response = await fetch(`/api/admin/book-orders/${encodeURIComponent(id)}/shipping`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setIssues(data.issues || []);
        throw Error(data.error || "Unable to prepare shipment.");
      }
      setDraft(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to prepare shipment.");
    } finally { setBusy(false); }
  }
  async function saveDraft() {
    if (!draft || !context || !values || saving || savedNotice) return;
    setSaving(true); setError(""); setSavedNotice("");
    try {
      const response = await fetch(`/api/admin/book-orders/${encodeURIComponent(id)}/shipping`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: currentInput(), expectedDraftVersion: context.savedDraft?.version ?? null }),
      });
      const data = await response.json();
      if (!response.ok) {
        setIssues(data.issues || []);
        throw Error(data.error || "Unable to save the draft.");
      }
      setContext(current => current ? { ...current, savedDraft: data.savedDraft,
        submission: current.submission ? { ...current.submission, status: "DRAFT" } : current.submission } : current);
      setDraft(data.preparation); setDirty(false);
      setSavedNotice("Shipping draft saved. You can leave and return to it later.");
    } catch (error) {
      setDraft(null);
      setError(error instanceof Error ? error.message : "Unable to save the draft.");
    } finally { setSaving(false); }
  }
  function download() {
    if (!draft) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${draft.orderReference.replace(/[^a-zA-Z0-9_-]/g, "_")}-shipping-preparation.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const blocked = !!context?.collection.problems.length || context?.savedDraft?.editable === false;
  const readOnly = context?.savedDraft?.editable === false;
  return <div className="max-w-5xl">
    <Link href={`/admin/book-orders/${id}`} className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft size={16} />Back to order</Link>
    <header className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Aramex</p>
      <h1 className="mt-2 text-3xl font-bold text-white">{readOnly ? "Book delivery shipment" : "Prepare book delivery"}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">{readOnly ? "Review the recorded shipment result and saved delivery details before dispatch." : "Review the recipient, packed parcels and cash to collect. Save a draft first. Sending a test shipment is a separate review step."}</p>
    </header>
    {loading && <p role="status" className="py-10 text-gray-400">Loading order details...</p>}
    {error && <div ref={errorSummary} tabIndex={-1} id="shipping-errors" role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200 focus:outline-none focus:ring-2 focus:ring-red-300">
      <p>{error}</p>
      {!!issues.length && <ul className="mt-2 list-disc space-y-1 pl-5">{issues.map((issue, index) => <li key={index}>{issueTarget(issue.field)
        ? <a className="inline-block py-2 underline" href={`#${issueTarget(issue.field)}`} onClick={event => { event.preventDefault(); document.getElementById(issueTarget(issue.field)!)?.focus(); }}>{issueName(issue.field)}: {issue.message}</a>
        : <span>{issueName(issue.field)}: {issue.message}</span>}</li>)}</ul>}
      {!issues.length && <button type="button" disabled={busy || saving || sending} onClick={() => { if (!dirty || window.confirm("Reload and replace your unsaved changes with the saved draft?")) setReload(value => value + 1); }} className="mt-3 underline">Reload preparation</button>}
    </div>}
    {context && values && <>
      {context.submission && <ShipmentStatus submission={context.submission} />}
      {context.submission && ["DRAFT", "REJECTED"].includes(context.submission.status) && <ShipmentSend orderId={id} context={context} dirty={dirty} blocked={blocked || busy || saving} onBusy={setSending} onReload={() => setReload(value => value + 1)} />}
      {context.submission && <ShipmentRecovery orderId={id} status={context.submission.status} />}
      {context.submission?.status === "CREATED" && <ShipmentTracking orderId={id} />}
      {context.submission?.status === "CREATED" && context.submission.environment === "UAT" && <ShipmentLabel orderId={id}
        onRetrieved={labelUrl => setContext(current => current?.submission ? { ...current, submission: { ...current.submission, labelUrl } } : current)} />}
      {context.savedDraft && <div className="mb-5 rounded-xl border border-gray-700 p-4 text-sm text-gray-300">
        <p className="font-semibold text-white">{context.savedDraft.editable ? "Saved shipping draft" : "Saved shipment details"}</p>
        <p className="mt-1">Last saved {new Date(context.savedDraft.updatedAt).toLocaleString()}.{context.savedDraft.editable ? " No shipment has been booked." : ""}</p>
        {context.savedDraft.editable && (context.savedDraft.stale
          ? <p role="status" className="mt-2 text-amber-200">The order or payment changed since this draft was saved. Check the recipient, parcels and current collection amount, then review and save again.</p>
          : <p className="mt-2">Your saved details are restored below. Review them to check the latest order and payment.</p>)}
        {!context.savedDraft.editable && <p role="alert" className="mt-2 text-amber-200">This shipment has moved beyond draft preparation and cannot be edited here.</p>}
        {!context.savedDraft.editable && context.savedDraft.stale && <p role="status" className="mt-2 text-amber-200">The order or payment changed after these shipment details were saved. Check the carrier booking before dispatch.</p>}
        {readOnly && <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-gray-400">Saved recipient</dt><dd className="mt-1 break-words">{context.savedDraft.input.recipientName}<br />{context.savedDraft.input.recipientPhone}</dd></div>
          <div><dt className="text-xs text-gray-400">Saved delivery address</dt><dd className="mt-1 break-words">{[context.savedDraft.input.addressLine1, context.savedDraft.input.addressLine2, context.savedDraft.input.addressLine3, context.savedDraft.input.city].filter(Boolean).join(", ")}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-gray-400">Saved parcels</dt><dd className="mt-1 space-y-1">{context.savedDraft.input.parcels.map((parcel, index) => <p key={index}>Parcel {index + 1}: {parcel.weightKg} kg · {parcel.lengthCm !== undefined && parcel.widthCm !== undefined && parcel.heightCm !== undefined ? `${parcel.lengthCm} × ${parcel.widthCm} × ${parcel.heightCm} cm` : "Dimensions not provided"}</p>)}</dd></div>
        </dl>}
      </div>}
      {!context.draftStorageAvailable && <p role="status" className="mb-5 rounded-xl border border-amber-200/30 p-4 text-sm text-amber-200">Saving drafts is awaiting the shipping database update. You can still review and download a preparation.</p>}
      {dirty && <p role="status" className="mb-4 text-sm text-amber-200">Unsaved changes. Review the details, then save the draft.</p>}
      {savedNotice && <p role="status" className="mb-4 rounded-xl border border-emerald-400/30 p-4 text-sm text-emerald-200">{savedNotice}</p>}
      <section className="mb-6 rounded-xl bg-[#1e293b] p-5">
        <div className="flex flex-wrap justify-between gap-3">
          <div><h2 className="font-semibold text-white">{context.reference}</h2><p className="mt-1 text-sm text-gray-400">{context.bookCount} books · {humanize(context.purpose)} · {humanize(context.status)}</p></div>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-[#0f172a]/60 p-4">
            <dt className="text-xs text-gray-400">Order total</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{money(context.orderTotalCents)}</dd>
            <p className="mt-2 text-xs text-gray-400">Books and any delivery fee charged to the customer.</p>
          </div>
          <div className="rounded-lg border border-brand-blue/25 bg-brand-blue/5 p-4">
            <dt className="text-xs text-gray-400">{readOnly ? "Current order collection amount" : "Courier collects from recipient"}</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{context.collection.amountCents === null ? "Review required" : money(context.collection.amountCents)}</dd>
            <p className="mt-2 text-xs text-gray-400">{context.collection.amountCents === 0
              ? "Already paid — nothing to collect on delivery."
              : context.collection.amountCents === null ? "Resolve the order requirements below to continue."
              : "Cash due on delivery. This amount is taken from the saved order."}</p>
          </div>
        </dl>
        <p className="mt-3 text-sm text-gray-400">Payment: {humanize(context.paymentMethod)} · {humanize(context.paymentStatus)}. Collection is calculated from the saved order.</p>
        {readOnly && <p className="mt-3 text-sm text-amber-200">These are current order amounts, not confirmation of the amount booked with Aramex. Check the carrier booking before dispatch, especially if payment changed.</p>}
        {!!context.collection.problems.length && <ul role="alert" className="mt-4 list-disc space-y-2 pl-5 text-sm text-amber-200">{context.collection.problems.map(problem => <li key={problem}>{problem}</li>)}</ul>}
        {!!context.collection.problems.length && <Link href={`/admin/book-orders/${id}#manage-order`} className="mt-4 inline-flex rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700">Review order and payment</Link>}
      </section>
      {!blocked && <form onSubmit={prepare} className="space-y-6">
        <fieldset disabled={busy || saving || sending} className="space-y-6 disabled:opacity-70">
          <section className="rounded-xl bg-[#1e293b] p-5 sm:p-6">
            <h2 className="font-semibold text-white">Recipient and address</h2>
            <p className="mt-2 text-xs text-gray-400"><RequiredMark /> Required fields</p>
            {context.purpose === "SELF" && <p className="mt-2 text-sm text-gray-300">For this self order, the purchaser is the delivery recipient. Their contact details are copied here for you to check.</p>}
            <p className="mt-2 break-words text-sm leading-6 text-gray-400">Original order address: {context.sourceAddress || "Not provided"}</p>
            <p className="mt-1 text-sm text-gray-400">Corrections here apply to this draft. They do not change the saved order.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm text-gray-300" htmlFor="shipping-name">Recipient name<RequiredMark /><input id="shipping-name" {...invalid("recipientName")} required minLength={2} maxLength={50} className={field} value={values.recipientName} onChange={event => change("recipientName", event.target.value)} /></label>
              <label className="text-sm text-gray-300" htmlFor="shipping-phone">Lebanese phone<RequiredMark /><input id="shipping-phone" {...invalid("recipientPhone")} required type="tel" maxLength={30} className={field} value={values.recipientPhone} onChange={event => change("recipientPhone", event.target.value)} placeholder="+961..." aria-describedby={issues.some(issue => issue.field === "recipientPhone") ? "shipping-errors shipping-phone-hint" : "shipping-phone-hint"} /><span id="shipping-phone-hint" className="mt-2 block text-xs text-gray-400">Use the recipient’s Lebanese delivery number (+961), even if the purchaser lives abroad.</span></label>
              <label className="text-sm text-gray-300" htmlFor="shipping-email">Recipient email (if known)<input id="shipping-email" {...invalid("recipientEmail")} type="email" maxLength={50} className={field} value={values.recipientEmail} onChange={event => change("recipientEmail", event.target.value)} /><span className="mt-2 block text-xs text-gray-400">For gifts, enter the recipient&apos;s email only if available.</span></label>
              <label className="text-sm text-gray-300" htmlFor="shipping-city">Delivery city / area<RequiredMark /><LebanonCityInput theme="dark" id="shipping-city" {...invalid("city")} required maxLength={120} placeholder="Start typing a city" className={field} aria-describedby={issues.some(issue => issue.field === "city") ? "shipping-errors shipping-city-hint" : "shipping-city-hint"} value={values.city} onValueChange={value => change("city", value)} /><span id="shipping-city-hint" className="mt-2 block text-xs text-gray-400">Choose a suggestion or enter your own area. Custom text can be saved in a draft; an approved city is needed before sending to Aramex.</span></label>
              {(["addressLine1", "addressLine2", "addressLine3"] as const).map((key, index) => <label key={key} className="text-sm text-gray-300 sm:col-span-2" htmlFor={`shipping-${key}`}>
                Address line {index + 1}{index === 0 ? " · street and building" : " (optional)"}{index === 0 && <RequiredMark />}
                <input id={`shipping-${key}`} {...invalid(key)} required={index === 0} minLength={index === 0 ? 4 : undefined} maxLength={50} className={field} value={values[key]} onChange={event => change(key, event.target.value)} />
                <span className={`mt-1 block text-xs ${values[key].length > 50 ? "text-amber-200" : "text-gray-400"}`}>{values[key].length}/50 characters{values[key].length > 50 ? " — split the address across the three lines." : ""}</span>
              </label>)}
            </div>
          </section>
          <section id="packed-parcels" tabIndex={-1} className="rounded-xl bg-[#1e293b] p-5 sm:p-6">
            <h2 className="font-semibold text-white">Packed parcels</h2>
            <p className="mt-2 text-sm text-gray-400">A parcel is one sealed box or envelope handed to the courier. If all the books fit in one package, enter one parcel. Add another only when you pack a separate package.</p>
            <p className="mt-2 text-sm text-gray-400">Enter each packed weight, including books and packaging. We add the weights to calculate the total shipment weight. Use kilograms (500 g = 0.5 kg).</p>
            <p id="parcel-dimensions-hint" className="mt-2 text-sm text-gray-400">Dimensions are optional. Leave all three blank, or enter the complete outside length, width and height in centimetres.</p>
            <div className="mt-5 space-y-4">
              {parcels.map((parcel, index) => <div key={index} className="rounded-lg border border-gray-700 p-4">
                <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Parcel {index + 1}</h3>
                  {parcels.length > 1 && <button type="button" aria-label={`Remove parcel ${index + 1}`} className="min-h-11 min-w-11 p-2 text-gray-400 hover:text-white" onClick={() => { setParcels(current => current.filter((_, i) => i !== index)); edited(); }}><Trash2 size={16} /></button>}
                </div>
                <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:grid-cols-4">{([
                  ["weightKg", "Weight (kg)"], ["lengthCm", "Length (cm)"],
                  ["widthCm", "Width (cm)"], ["heightCm", "Height (cm)"],
                ] as const).map(([key, label]) => <label key={key} className="text-xs text-gray-300" htmlFor={`parcel-${index}-${key}`}>{label}{key === "weightKg" || hasDimensions(parcel) ? <RequiredMark /> : " (optional)"}
                  <input id={`parcel-${index}-${key}`} {...invalid(`parcels.${index}.${key}`)} type="number" required={key === "weightKg" || hasDimensions(parcel)} min="0.001" max="100" step="0.001" className={field} value={parcel[key]} onChange={event => changeParcel(index, key, event.target.value)} />
                </label>)}</div>
              </div>)}
            </div>
            <button type="button" disabled={parcels.length >= 100} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-brand-blue disabled:opacity-50" onClick={() => { setParcels(current => [...current, emptyParcel()]); edited(); }}><PackagePlus size={18} />Add parcel</button>
          </section>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="rounded-xl bg-brand-blue px-5 py-3 font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{busy ? "Checking details..." : "Review shipping draft"}</button>
            <p className="text-sm text-gray-400">Review first, then save your draft. Nothing is sent to Aramex.</p>
          </div>
        </fieldset>
      </form>}
      {draft && <section ref={result} tabIndex={-1} aria-label="Shipping draft review" className="mt-6 rounded-xl border border-brand-blue/40 bg-[#1e293b] p-5 outline-none sm:p-6">
        <h2 className="text-lg font-semibold text-white">{savedNotice ? "Draft saved — not booked" : "Check this draft before saving"}</h2>
        <p className="mt-2 text-sm text-gray-300">{savedNotice ? "Your details are saved. No shipment or pickup has been created." : "Review the recipient, address and collection amount below. Checking or downloading does not save your changes."}</p>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-gray-400">Recipient</dt><dd className="mt-1 text-white">{draft.recipient.name}<br />{draft.recipient.phone}</dd></div>
          <div><dt className="text-gray-400">Delivery address</dt><dd className="mt-1 break-words text-white">{draft.recipient.addressLines.join(", ")}<br />{draft.recipient.city}, Lebanon</dd></div>
          <div><dt className="text-gray-400">Packed shipment</dt><dd className="mt-1 text-white">{draft.numberOfPieces} parcels · {draft.totalWeightKg} kg · {draft.contents.bookCount} books</dd></div>
          <div><dt className="text-gray-400">Order total</dt><dd className="mt-1 font-semibold text-white">{money(draft.orderTotalCents)}</dd></div>
          <div><dt className="text-gray-400">Courier collects from recipient</dt><dd className="mt-1 font-semibold text-white">{money(draft.collection.amountCents)}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-gray-300">{draft.collection.reason}</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-amber-200">{draft.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" disabled={saving || sending || !context.draftStorageAvailable || !!savedNotice}
            onClick={saveDraft} className="rounded-xl bg-brand-blue px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            {saving ? "Saving draft..." : savedNotice ? "Draft saved" : "Save shipping draft"}
          </button>
          {savedNotice && <Link href={`/admin/book-orders/${id}`} className="inline-flex min-h-11 items-center rounded-lg border border-gray-600 px-4 py-2 text-sm text-white">Return to order</Link>}
        </div>
        <button type="button" onClick={download} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-600 px-4 py-2 text-sm text-white"><Download size={16} />Download preparation</button>
        <p className="mt-2 text-xs text-gray-400">Contains customer details. This review file cannot be submitted directly to Aramex.</p>
      </section>}
      {!readOnly && <details className="mt-8 rounded-xl border border-gray-700 p-5">
        <summary className="cursor-pointer font-semibold text-white">Aramex setup requirements</summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-400">{context.pendingConfirmations.map(item => <li key={item}>{item}</li>)}</ul>
      </details>}
    </>}
  </div>;
}
