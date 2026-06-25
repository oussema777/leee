export type WebhookEventType = "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "COMPLAINED";

export interface ParsedWebhookEvent {
  type: WebhookEventType;
  campaignId: string;
  email: string;
  providerEventId: string | null;
  occurredAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseResendWebhook(payload: any, svixId: string | null): ParsedWebhookEvent | null {
  const evt: string = payload?.type ?? "";
  const data = payload?.data ?? {};
  const email: string | undefined = data?.to?.[0] ?? data?.email;
  const campaignId: string | undefined = data?.tags?.campaignId; // tags is a Record map, not an array
  const bounceType: string | undefined = data?.bounce?.type;     // "Permanent" | "Transient" | "Undetermined"
  const occurredAt = data?.created_at ? new Date(data.created_at) : new Date();

  let type: WebhookEventType | null;
  switch (evt) {
    case "email.delivered": type = "DELIVERED"; break;
    case "email.opened": type = "OPENED"; break;
    case "email.clicked": type = "CLICKED"; break;
    case "email.complained": type = "COMPLAINED"; break;
    case "email.bounced": type = bounceType === "Permanent" ? "BOUNCED" : null; break; // only hard bounces
    default: type = null;
  }
  if (!type || !campaignId || !email) return null;
  return { type, campaignId, email, providerEventId: svixId ?? null, occurredAt };
}
