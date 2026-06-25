import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { resolveRecipients } from "@/lib/newsletter/recipients";
import { signUnsubToken } from "@/lib/newsletter/token";

const BATCH_SIZE = parseInt(process.env.NEWSLETTER_BATCH_SIZE || "100");
const SECRET = process.env.NEWSLETTER_UNSUB_SECRET || "";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const c = await db.campaign.findUnique({ where: { id } });
    if (!c) return errorResponse("Campaign not found", 404);
    if (!c.lastTestedAt) return errorResponse("Send a test before sending to a group", 400);
    if (c.status !== "DRAFT") return errorResponse("Campaign already enqueued", 400);

    const [contacts, suppressedRows] = await Promise.all([
      db.contact.findMany({
        where: { deletedAt: null, status: "SUBSCRIBED", tags: { hasSome: c.targetTags } },
        select: { email: true, name: true, tags: true, status: true },
      }),
      db.suppression.findMany({ select: { email: true } }),
    ]);
    const suppressed = new Set(suppressedRows.map((s) => s.email));
    const recipients = resolveRecipients(contacts as never, c.targetTags, suppressed);

    // Pre-generate each row id so the signed unsubToken is set in a single create
    // (no placeholder, no second pass, no cross-campaign collisions).
    await db.$transaction(async (tx) => {
      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        const rid = crypto.randomUUID();
        await tx.campaignRecipient.create({
          data: {
            id: rid,
            campaignId: id,
            email: r.email,
            name: r.name,
            batchIndex: Math.floor(i / BATCH_SIZE),
            unsubToken: signUnsubToken({ rid, cid: id }, SECRET),
          },
        });
      }
      await tx.campaign.update({
        where: { id },
        data: { status: "SENDING", enqueuedAt: new Date(), recipientCount: recipients.length },
      });
    });

    return NextResponse.json({ enqueued: recipients.length });
  } catch {
    return errorResponse("Failed to enqueue campaign");
  }
}
