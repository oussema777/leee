import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { computeSummary } from "@/lib/newsletter/summary";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const campaign = await db.campaign.findUnique({ where: { id } });
    if (!campaign) return errorResponse("Campaign not found", 404);

    const [sent, delivered, bounces, unsubscribes, openRows, clickRows] = await Promise.all([
      db.campaignRecipient.count({ where: { campaignId: id, status: "SENT" } }),
      db.campaignEvent.count({ where: { campaignId: id, type: "DELIVERED" } }),
      db.campaignEvent.count({ where: { campaignId: id, type: "BOUNCED" } }),
      db.campaignEvent.count({ where: { campaignId: id, type: "UNSUBSCRIBED" } }),
      db.campaignEvent.findMany({ where: { campaignId: id, type: "OPENED" }, select: { email: true }, distinct: ["email"] }),
      db.campaignEvent.findMany({ where: { campaignId: id, type: "CLICKED" }, select: { email: true }, distinct: ["email"] }),
    ]);

    const summary = computeSummary({
      sent,
      delivered,
      uniqueOpens: openRows.length,
      uniqueClicks: clickRows.length,
      unsubscribes,
      bounces,
    });

    // "still finalizing" while sending, or within ~10 minutes of completion (webhooks lag).
    const recentlySent =
      campaign.sentAt != null && Date.now() - new Date(campaign.sentAt).getTime() < 10 * 60 * 1000;
    const finalizing = campaign.status !== "SENT" || recentlySent;

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        subject: campaign.subject,
        status: campaign.status,
        locale: campaign.locale,
        targetTags: campaign.targetTags,
        recipientCount: campaign.recipientCount,
        sentAt: campaign.sentAt,
        createdAt: campaign.createdAt,
      },
      summary,
      finalizing,
    });
  } catch {
    return errorResponse("Failed to load campaign summary");
  }
}
