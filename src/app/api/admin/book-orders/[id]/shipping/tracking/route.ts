import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeShipping, shippingJson as json } from "@/lib/aramex/access";
import { shipmentTracking } from "@/lib/aramex/tracking";
import { trackingLookupAvailable } from "@/lib/aramex/tracking-lookup";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeShipping(request); if (auth instanceof NextResponse) return auth;
    const tracking = await shipmentTracking(db, (await params).id);
    return tracking ? json({ ...tracking, lookupAvailable: tracking.environment === "UAT" && trackingLookupAvailable() }) : json({ error: "Shipment not found." }, 404);
  } catch {
    return json({ error: "Tracking history is unavailable. Its storage may not be installed yet." }, 503);
  }
}
