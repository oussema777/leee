import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeShipping, shippingJson as json } from "@/lib/aramex/access";
import { configuredTrackingLookup } from "@/lib/aramex/tracking-lookup";
import { syncTracking } from "@/lib/aramex/tracking-sync";
export const runtime = "nodejs";
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let auth;
  try { auth = await authorizeShipping(request); }
  catch { return json({ error: "Unable to check tracking access." }, 503); }
  if (auth instanceof NextResponse) return auth;
  // JSON-only request; no caller-supplied AWB, credentials, endpoint or event data.
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Send a JSON request." }, 415);
  let lookup;
  try { lookup = configuredTrackingLookup(); }
  catch { return json({ error: "Direct UAT tracking is not configured. Verify account access and fixed-IP routing before enabling it." }, 503); }
  try {
    return json(await syncTracking(db, (await params).id, lookup, request.signal));
  } catch (error) {
    if (error instanceof Error && ["TRACKING_NOT_ELIGIBLE", "TRACKING_SHIPMENT_CHANGED"].includes(error.message)) {
      return json({ error: "Tracking requires an unchanged, confirmed UAT shipment. Reload the order." }, 409);
    }
    return json({ error: "Unable to retrieve and save a verified Aramex history. Existing updates were kept; no booking or payment status changed." }, 503);
  }
}
