import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeShipping, shippingJson as json } from "@/lib/aramex/access";
import { configuredLabelLookup, labelLookupAvailable } from "@/lib/aramex/label-lookup";
import { retrieveLabel } from "@/lib/aramex/label-retrieval";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeShipping(request);
    if (auth instanceof NextResponse) return auth;
    return json({ available: labelLookupAvailable() });
  } catch { return json({ error: "Unable to check label access." }, 503); }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let auth;
  try { auth = await authorizeShipping(request); }
  catch { return json({ error: "Unable to check label access." }, 503); }
  if (auth instanceof NextResponse) return auth;
  // JSON-only request; no caller-supplied AWB, credentials, endpoint or event data.
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Send a JSON request." }, 415);
  let lookup;
  try { lookup = configuredLabelLookup(); }
  catch { return json({ error: "UAT label retrieval is not configured. Confirm account access, origin entity and label format before enabling it." }, 503); }
  try {
    return json(await retrieveLabel(db, (await params).id, lookup, auth.userId, request.signal));
  } catch (error) {
    if (error instanceof Error && ["LABEL_NOT_ELIGIBLE", "LABEL_SHIPMENT_CHANGED"].includes(error.message)) {
      return json({ error: "Label retrieval requires an unchanged, confirmed UAT shipment. Reload the order." }, 409);
    }
    return json({ error: "Unable to retrieve a verified Aramex label. Any existing label was kept. No new shipment was created." }, 503);
  }
}
