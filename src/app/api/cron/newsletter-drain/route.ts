import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyMergeTags, injectUnsubscribeFooter } from "@/lib/newsletter/render";
import { idempotencyKeyFor, nextBatchIndex } from "@/lib/newsletter/drain";
import { sendNewsletterBatch } from "@/lib/email";

// Route-segment config (App Router): force dynamic + extend the timeout for this handler.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETRY_BUDGET = 3;
const BATCHES_PER_TICK = 5;      // tune under the function timeout
const INTER_BATCH_MS = 600;      // small pause between batches to respect Resend's API rate limit
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  return !!secret && header === `Bearer ${secret}`;
}

// Hash a campaign id to a stable bigint key for pg advisory locks.
// Uses BigInt() constructor (not 0n/131n literals) to stay compatible with the
// project's ES2017 tsc target while keeping bigint arithmetic.
const LOCK_BASE = BigInt(131);
const LOCK_MOD = BigInt("9223372036854775783");
function lockKey(id: string): bigint {
  let h = BigInt(0);
  for (const ch of id) h = (h * LOCK_BASE + BigInt(ch.charCodeAt(0))) % LOCK_MOD;
  return h;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sending = await db.campaign.findMany({ where: { status: "SENDING" }, select: { id: true } });
  let processed = 0;

  for (const { id: campaignId } of sending) {
    await db.$transaction(async (tx) => {
      // Non-blocking single-flight lock: skip this campaign if another tick holds it.
      const locked = await tx.$queryRawUnsafe<{ pg_try_advisory_xact_lock: boolean }[]>(
        `SELECT pg_try_advisory_xact_lock($1::bigint)`, lockKey(campaignId).toString()
      );
      if (!locked[0]?.pg_try_advisory_xact_lock) return;

      const campaign = await tx.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign || campaign.status !== "SENDING") return;

      for (let n = 0; n < BATCHES_PER_TICK; n++) {
        const rows = await tx.campaignRecipient.findMany({ where: { campaignId } });
        const drainRows = rows.map((r) => ({ batchIndex: r.batchIndex, status: r.status, attempts: r.attempts }));
        const bi = nextBatchIndex(drainRows, RETRY_BUDGET);
        if (bi === null) {
          // Drained: SENT only if no row is permanently FAILED; otherwise FAILED.
          const hasFailed = rows.some((r) => r.status === "FAILED");
          await tx.campaign.update({
            where: { id: campaignId },
            data: hasFailed ? { status: "FAILED" } : { status: "SENT", sentAt: new Date() },
          });
          break;
        }
        const batch = rows.filter((r) => r.batchIndex === bi);
        const emails = batch.map((r) => {
          const merged = applyMergeTags(campaign.html, { name: r.name });
          const url = `${SITE}/api/public/newsletter/unsubscribe?token=${encodeURIComponent(r.unsubToken)}`;
          const html = injectUnsubscribeFooter(merged, url, campaign.locale === "AR" ? "AR" : "EN");
          return {
            to: r.email,
            subject: campaign.subject,
            html,
            headers: {
              "List-Unsubscribe": `<${url}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          };
        });

        try {
          const sent = await sendNewsletterBatch(emails, idempotencyKeyFor(campaignId, bi), campaignId);
          // Sequential writes: Prisma interactive transactions run on one connection — no Promise.all.
          for (let i = 0; i < batch.length; i++) {
            await tx.campaignRecipient.update({
              where: { id: batch[i].id },
              data: { status: "SENT", sentAt: new Date(), providerMessageId: sent[i]?.id ?? null },
            });
          }
        } catch (e) {
          const msg = (e as Error).message.slice(0, 500);
          await tx.campaignRecipient.updateMany({
            where: { id: { in: batch.map((r) => r.id) } },
            data: { status: "FAILED", attempts: { increment: 1 }, error: msg },
          });
        }
        processed++;
        await sleep(INTER_BATCH_MS);
      }
    }, { timeout: 55_000 });
  }

  return NextResponse.json({ processed });
}
