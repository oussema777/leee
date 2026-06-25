import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { applyMergeTags, injectUnsubscribeFooter } from "@/lib/newsletter/render";
import { sendNewsletterBatch } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const { addresses } = await request.json();
    const list: string[] = Array.isArray(addresses) ? addresses.slice(0, 3) : [];
    if (list.length === 0) return errorResponse("Provide 1–3 test addresses", 400);
    const c = await db.campaign.findUnique({ where: { id } });
    if (!c) return errorResponse("Campaign not found", 404);

    const emails = list.map((to) => {
      const merged = applyMergeTags(c.html, { name: "Test" });
      const html = injectUnsubscribeFooter(merged, "#", c.locale === "AR" ? "AR" : "EN");
      return { to, subject: `[TEST] ${c.subject}`, html };
    });
    await sendNewsletterBatch(emails, `test:${id}:${Date.now()}`, id);
    await db.campaign.update({ where: { id }, data: { lastTestedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Failed to send test");
  }
}
