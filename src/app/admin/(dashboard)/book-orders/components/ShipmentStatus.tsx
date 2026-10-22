import { safeLabelUrl, shipmentStatusText, type SubmissionView } from "@/lib/aramex/submission-status";

export function ShipmentStatus({ submission }: { submission: SubmissionView }) {
  const { status } = submission;
  const uncertain = status === "SUBMITTING" || status === "UNKNOWN";
  const labelUrl = safeLabelUrl(submission.labelUrl);
  return <section aria-label="Aramex shipment status" className="mb-5 rounded-xl border border-gray-700 bg-[#1e293b] p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-semibold text-white">{status === "DRAFT" ? "Draft only — no shipment booked" : shipmentStatusText(status)}</h2>
      <span className="rounded bg-[#0f172a] px-2 py-1 text-xs text-gray-300">{submission.environment === "UAT" ? "Aramex test environment" : submission.environment}</span>
    </div>
    {status === "CREATED" ? <>
      <p className="mt-3 text-sm text-gray-300">Tracking number: <strong className="break-all text-white">{submission.trackingNumber || "Awaiting confirmation"}</strong></p>
      {labelUrl ? <a href={labelUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
        className="mt-4 inline-flex rounded-lg border border-brand-blue/40 px-4 py-2 text-sm font-semibold text-brand-blue">Open printable label</a>
        : <p className="mt-3 text-sm text-amber-200">Shipment created; label is not available yet. Retrieve the label for this tracking number before dispatch. Do not create another shipment.</p>}
      <p className="mt-3 text-sm text-gray-400">Shipment creation does not confirm pickup or delivery.</p>
      {submission.environment === "UAT" && <p className="mt-3 text-sm text-amber-200">This is a test shipment. Do not use it to dispatch a customer order.</p>}
    </> : uncertain ? <p role="status" className="mt-3 text-sm leading-6 text-amber-200">
      Aramex may already have created this shipment. Another booking is blocked. Check with Aramex and reconcile the result before trying again.
    </p> : <>
      {status === "REJECTED" && <p className="mt-3 text-sm text-amber-200">No shipment was created for this attempt, based on the carrier response or recorded verification. Correct the details, review and save the draft before another attempt.</p>}
      <p className="mt-3 text-sm leading-6 text-gray-400">Review and save your details before the separate test-shipment sending step.</p>

    </>}
  </section>;
}
