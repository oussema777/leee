import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin } from "@/lib/api-utils";

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
export const shippingJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
export async function authorizeShipping(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) {
    return shippingJson({ error: "Sign in to prepare shipments." }, 401);
  }
  const user = await db.user.findUnique({ where: { id: auth.session.userId }, select: { role: true } });
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return shippingJson({ error: "Shipment preparation requires an admin role." }, 403);
  }
  return auth.session;
}
