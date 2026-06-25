import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { parseResendWebhook } from "@/lib/newsletter/webhook";

let warnedMissingSecret = false;

export async function POST(request: NextRequest) {
  const raw = await request.text();

  // Resend webhooks are Svix-signed. Verify the raw body against RESEND_WEBHOOK_SECRET
  // using the svix-* headers BEFORE trusting/parsing `raw`.
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    try {
      const wh = new Webhook(secret);
      wh.verify(raw, {
        "svix-id": request.headers.get("svix-id") ?? "",
        "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
        "svix-signature": request.headers.get("svix-signature") ?? "",
      });
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (!warnedMissingSecret) {
    // Local/dev: skip verification but warn once so it isn't silently skipped in prod.
    warnedMissingSecret = true;
    console.warn(
      "[newsletter/webhook] RESEND_WEBHOOK_SECRET is unset — skipping Svix signature verification.",
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const event = parseResendWebhook(payload, request.headers.get("svix-id"));
  if (!event) return NextResponse.json({ ok: true });

  const { type, campaignId, email, providerEventId, occurredAt } = event;

  try {
    // Idempotency: dedupe on providerEventId (the svix-id) when present, else on the
    // composite (campaignId, email, type, occurredAt) — never on email_id.
    const dup = providerEventId
      ? await db.campaignEvent.findUnique({ where: { providerEventId } })
      : await db.campaignEvent.findFirst({ where: { campaignId, email, type, occurredAt } });
    if (dup) return NextResponse.json({ ok: true });

    await db.campaignEvent.create({
      data: { campaignId, type, email, providerEventId, occurredAt },
    });

    if (type === "BOUNCED" || type === "COMPLAINED") {
      const reason = type === "BOUNCED" ? "HARD_BOUNCE" : "COMPLAINED";
      const status = type === "BOUNCED" ? "BOUNCED" : "COMPLAINED";
      await db.suppression.upsert({ where: { email }, update: {}, create: { email, reason } });
      await db.contact.updateMany({ where: { email }, data: { status } });
    }
  } catch {
    // Lost a race on the unique providerEventId, or transient DB error → ack so Resend
    // doesn't redeliver indefinitely; the event is either already recorded or retried later.
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
