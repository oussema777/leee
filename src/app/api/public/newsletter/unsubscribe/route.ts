import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUnsubToken } from "@/lib/newsletter/token";

const SECRET = process.env.NEWSLETTER_UNSUB_SECRET || "";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";

async function suppress(token: string): Promise<boolean> {
  const payload = verifyUnsubToken(token, SECRET);
  if (!payload) return false;
  const r = await db.campaignRecipient.findUnique({ where: { id: payload.rid } });
  if (!r) return false;
  await db.suppression.upsert({ where: { email: r.email }, update: {}, create: { email: r.email, reason: "UNSUBSCRIBED" } });
  await db.contact.updateMany({ where: { email: r.email }, data: { status: "UNSUBSCRIBED" } });
  // Record a campaign-scoped UNSUBSCRIBED event so the summary card can attribute it.
  // Idempotent: skip if this recipient already has one (a recipient can click twice).
  const existing = await db.campaignEvent.findFirst({
    where: { campaignId: payload.cid, email: r.email, type: "UNSUBSCRIBED" },
  });
  if (!existing) {
    await db.campaignEvent.create({
      data: { campaignId: payload.cid, type: "UNSUBSCRIBED", email: r.email, occurredAt: new Date() },
    });
  }
  return true;
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const c = await db.campaignRecipient.findUnique({
    where: { unsubToken: token }, select: { campaign: { select: { locale: true } } },
  }).catch(() => null);
  await suppress(token);
  const locale = c?.campaign.locale === "AR" ? "ar" : "en";
  return NextResponse.redirect(`${SITE}/${locale}/unsubscribe?done=1`);
}

export async function POST(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") || "";
  await suppress(token);
  return NextResponse.json({ ok: true });
}
