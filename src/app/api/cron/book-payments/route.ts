import { NextRequest } from "next/server";
import { reconcileWhishOrders } from '@/lib/whish-pay/customer';
import { expireWhishPayments, privateJson } from "@/lib/book-orders/whish-server";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== "Bearer " + process.env.CRON_SECRET) return privateJson({ error: "Unauthorized" }, 401);
  try { const whish = process.env.WHISH_PAY_SANDBOX_ENABLED === 'true' ? await reconcileWhishOrders() : null; return privateJson({ whish, expired: await expireWhishPayments() }); }
  catch { return privateJson({ error: "Payment cleanup failed." }, 500); }
}
