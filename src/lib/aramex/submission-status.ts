// Safe default copy shared by API and UI. Actual UAT configuration availability
// is checked separately through the authenticated submission endpoint.
export const submissionAvailability = {
  enabled: false as const,
  reason: "Shipment sending is awaiting Aramex account access, approved service settings and IP whitelisting.",
};

export function draftEditable(status: string) {
  return status === "DRAFT" || status === "REJECTED";
}

export function safeLabelUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 4096) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (!["aramex.net", "aramex.com"].some(domain => host === domain || host.endsWith("." + domain))) return null;
    return url.href;
  } catch { return null; }
}

export function shipmentStatusText(status: string) {
  switch (status) {
    case "CREATED": return "Shipment created";
    case "SUBMITTING": return "Waiting for shipment confirmation";
    case "UNKNOWN": return "Shipment confirmation needed";
    case "REJECTED": return "Shipment request rejected";
    case "DRAFT": return "Shipping draft saved";
    default: return "Shipment requires review";
  }
}

export type SubmissionView = {
  enabled: false;
  reason: string;
  status: string;
  environment: string;
  trackingNumber: string | null;
  labelUrl: string | null;
  bookedAt: string | null;
};

export function submissionView(row: {
  status: string; environment: string; trackingNumber?: string | null;
  labelUrl?: string | null; bookedAt?: Date | null;
} | null): SubmissionView {
  return {
    ...submissionAvailability, status: row?.status ?? "DRAFT", environment: row?.environment ?? "UAT",
    trackingNumber: row?.status === "CREATED" ? row.trackingNumber ?? null : null,
    labelUrl: row?.status === "CREATED" ? safeLabelUrl(row.labelUrl) : null,
    bookedAt: row?.bookedAt?.toISOString() ?? null,
  };
}
