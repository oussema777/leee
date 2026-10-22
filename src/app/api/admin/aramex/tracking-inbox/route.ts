import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeShipping, shippingJson as json } from "@/lib/aramex/access";
import { inboxQuery, trackingInbox } from "@/lib/aramex/tracking-inbox";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeShipping(request);
    if (auth instanceof NextResponse) return auth;
    const parsed = inboxQuery.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return json({ error: "Enter a full tracking number (5–50 letters, numbers or hyphens) and a valid page." }, 400);
    return json(await trackingInbox(db, parsed.data));
  } catch {
    return json({ error: "Tracking inbox is unavailable. Check that tracking storage has been installed, then try again." }, 503);
  }
}
