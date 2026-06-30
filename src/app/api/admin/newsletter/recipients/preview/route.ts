import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { resolveRecipients } from "@/lib/newsletter/recipients";

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { tags } = await request.json();
    if (!Array.isArray(tags) || tags.length === 0) return NextResponse.json({ count: 0 });
    const [contacts, suppressedRows] = await Promise.all([
      db.contact.findMany({
        where: { deletedAt: null, status: "SUBSCRIBED", tags: { hasSome: tags } },
        select: { email: true, name: true, tags: true, status: true },
      }),
      db.suppression.findMany({ select: { email: true } }),
    ]);
    const suppressed = new Set(suppressedRows.map((s) => s.email));
    const count = resolveRecipients(contacts as never, tags, suppressed).length;
    return NextResponse.json({ count });
  } catch {
    return errorResponse("Failed to preview recipients");
  }
}
