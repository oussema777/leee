import { NextRequest } from "next/server";
import { expireWhishPayments, privateJson } from "@/lib/book-orders/whish-server";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== "Bearer " + process.env.CRON_SECRET) return privateJson({ error: "Unauthorized" }, 401);
  try { return privateJson({ expired: await expireWhishPayments() }); }
  catch { return privateJson({ error: "Payment cleanup failed." }, 500); }
}
