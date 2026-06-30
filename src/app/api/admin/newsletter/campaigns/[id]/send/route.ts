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

    // Pre-compute all ledger rows in memory so the DB write is a single createMany,
    // not N sequential round-trips (which would blow Prisma's 5s default tx timeout on large lists).
    const rows = recipients.map((r, i) => {
      const rid = crypto.randomUUID();
      return {
        id: rid,
        campaignId: id,
        email: r.email,
        name: r.name,
        batchIndex: Math.floor(i / BATCH_SIZE),
        unsubToken: signUnsubToken({ rid, cid: id }, SECRET),
      };
    });

    await db.$transaction(
      async (tx) => {
        if (rows.length > 0) {
          await tx.campaignRecipient.createMany({ data: rows });
        }
        await tx.campaign.update({
          where: { id },
          data: { status: "SENDING", enqueuedAt: new Date(), recipientCount: rows.length },
        });
      },
      { timeout: 30_000 }
    );

    return NextResponse.json({ enqueued: rows.length });
  } catch {
    return errorResponse("Failed to enqueue campaign");
  }
}
