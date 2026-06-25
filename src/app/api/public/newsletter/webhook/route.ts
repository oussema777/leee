import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Map Resend event type → our enum, or null to ignore (e.g. soft bounce).
function mapType(evt: string, bounceType?: string): "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "COMPLAINED" | null {
  switch (evt) {
    case "email.delivered": return "DELIVERED";
    case "email.opened": return "OPENED";
    case "email.clicked": return "CLICKED";
    case "email.complained": return "COMPLAINED";
    case "email.bounced": return bounceType === "hard" ? "BOUNCED" : null;
    default: return null;
  }
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  // TODO (one-time setup): verify the Resend webhook signature using RESEND_WEBHOOK_SECRET
  // and the svix-id/svix-timestamp/svix-signature headers before trusting `raw`.
  // Documented as a setup step; left as a clearly-marked TODO so it isn't silently skipped.
  let payload: any;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }

  const evt: string = payload?.type ?? "";
  const data = payload?.data ?? {};
  const email: string | undefined = data?.to?.[0] ?? data?.email;
  // The webhook delivery's own event id (NOT email_id, which repeats across event types for one email).
  const providerEventId: string | undefined = payload?.id;
  const campaignId: string | undefined = (data?.tags ?? []).find((t: any) => t.name === "campaignId")?.value;
  const bounceType: string | undefined = data?.bounce?.type;
  const occurredAt = data?.created_at ? new Date(data.created_at) : new Date();

  const type = mapType(evt, bounceType);
  if (!type || !campaignId || !email) return NextResponse.json({ ok: true });

  // Idempotency: dedupe on providerEventId when present, else on the composite
  // (campaignId, email, type, occurredAt) — never on email_id.
  const dup = providerEventId
    ? await db.campaignEvent.findUnique({ where: { providerEventId } })
    : await db.campaignEvent.findFirst({ where: { campaignId, email, type, occurredAt } });
  if (dup) return NextResponse.json({ ok: true });

  try {
    await db.campaignEvent.create({
      data: { campaignId, type, email, providerEventId, occurredAt },
    });
  } catch {
    // Lost a race on the unique providerEventId → already recorded, ignore.
    return NextResponse.json({ ok: true });
  }

  if (type === "BOUNCED" || type === "COMPLAINED") {
    const reason = type === "BOUNCED" ? "HARD_BOUNCE" : "COMPLAINED";
    const status = type === "BOUNCED" ? "BOUNCED" : "COMPLAINED";
    await db.suppression.upsert({ where: { email }, update: {}, create: { email, reason } });
    await db.contact.updateMany({ where: { email }, data: { status } });
  }

  return NextResponse.json({ ok: true });
}
